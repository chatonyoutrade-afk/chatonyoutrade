import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "../../../auth";
import { getDb } from "../../../../db";
import { ownerSecurity, tradingEvents } from "../../../../db/schema";
import { hashPassword, verifyPassword } from "../../../../lib/password";
import { mailerStatus, sendMailWithResult } from "../../../../lib/mailer";

export const dynamic = "force-dynamic";
const CHALLENGE_TTL_MS = 10 * 60 * 1000, RESEND_WAIT_MS = 60 * 1000, LOCK_MS = 15 * 60 * 1000, MAX_FAILURES = 5;

function maskedEmail(email:string){const [local,domain]=email.split("@");return `${local.slice(0,2)}${"•".repeat(Math.max(2,local.length-2))}@${domain}`}
function newCode(){const digits=[];while(digits.length<6){const values=crypto.getRandomValues(new Uint8Array(8));for(const value of values){if(value<250)digits.push(String(value%10));if(digits.length===6)break}}return digits.join("")}
async function status(userEmail:string){const [row]=await getDb().select().from(ownerSecurity).where(eq(ownerSecurity.userEmail,userEmail)).limit(1),now=Date.now();return{enabled:Boolean(row?.enabled),verifiedAt:row?.verifiedAt||null,challengePending:Boolean(row?.codeHash&&row.challengeExpiresAt&&row.challengeExpiresAt>now),expiresAt:row?.challengeExpiresAt||null,lockedUntil:row?.lockedUntil&&row.lockedUntil>now?row.lockedUntil:null,email:maskedEmail(userEmail),emailConfigured:mailerStatus().configured}}

export async function GET(){const user=await getUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});return NextResponse.json(await status(user.email))}

export async function POST(request:Request){
 const user=await getUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});if(!user.emailVerified)return NextResponse.json({error:"Verify your account email first"},{status:403});
 const body=await request.json().catch(()=>({})) as Record<string,unknown>,action=String(body.action||""),db=getDb(),now=Date.now(),[existing]=await db.select().from(ownerSecurity).where(eq(ownerSecurity.userEmail,user.email)).limit(1);
 if(existing?.lockedUntil&&existing.lockedUntil>now)return NextResponse.json({error:"Too many incorrect codes. Try again later.",retryAfterSeconds:Math.ceil((existing.lockedUntil-now)/1000)},{status:429});
 if(action==="request"){
  if(!mailerStatus().configured)return NextResponse.json({error:"Security email delivery is not configured"},{status:503});
  if(existing?.challengeIssuedAt&&now-existing.challengeIssuedAt<RESEND_WAIT_MS)return NextResponse.json({error:"Wait one minute before requesting another code"},{status:429});
  const code=newCode(),hashed=await hashPassword(code),values={userEmail:user.email,enabled:existing?.enabled||false,verifiedAt:existing?.verifiedAt||null,codeHash:hashed.hash,codeSalt:hashed.salt,codeIterations:hashed.iterations,challengeIssuedAt:now,challengeExpiresAt:now+CHALLENGE_TTL_MS,failures:0,lockedUntil:0,updatedAt:now};
  await db.insert(ownerSecurity).values(values).onConflictDoUpdate({target:ownerSecurity.userEmail,set:values});
  const delivery=await sendMailWithResult(user.email,"ChatOnYou owner verification code",[`Your ChatOnYou Trade security code is: ${code}`,"","It expires in 10 minutes and can be used once.","Do not share this code. ChatOnYou will never ask for it by phone or chat.","","This verifies email possession for owner security. It does not enable real-money trading."].join("\n"));
  if(!delivery.sent){await db.update(ownerSecurity).set({codeHash:null,codeSalt:null,codeIterations:null,challengeExpiresAt:null,updatedAt:Date.now()}).where(eq(ownerSecurity.userEmail,user.email));return NextResponse.json({error:"The security email could not be delivered"},{status:503})}
  return NextResponse.json({ok:true,...await status(user.email)});
 }
 if(action==="verify"){
  const code=String(body.code||"").trim();if(!/^\d{6}$/.test(code))return NextResponse.json({error:"Enter the 6-digit security code"},{status:400});
  if(!existing?.codeHash||!existing.codeSalt||!existing.codeIterations||!existing.challengeExpiresAt||existing.challengeExpiresAt<=now)return NextResponse.json({error:"This code has expired. Request a new one."},{status:400});
  const valid=await verifyPassword(code,{hash:existing.codeHash,salt:existing.codeSalt,iterations:existing.codeIterations});
  if(!valid){const failures=existing.failures+1,lockedUntil=failures>=MAX_FAILURES?now+LOCK_MS:0;await db.update(ownerSecurity).set({failures,lockedUntil,updatedAt:now}).where(eq(ownerSecurity.userEmail,user.email));return NextResponse.json({error:lockedUntil?"Too many incorrect codes. Try again in 15 minutes.":`Incorrect code. ${MAX_FAILURES-failures} attempts remaining.`},{status:400})}
  await db.update(ownerSecurity).set({enabled:true,verifiedAt:now,codeHash:null,codeSalt:null,codeIterations:null,challengeIssuedAt:null,challengeExpiresAt:null,failures:0,lockedUntil:0,updatedAt:now}).where(eq(ownerSecurity.userEmail,user.email));
  await db.insert(tradingEvents).values({id:crypto.randomUUID(),userEmail:user.email,category:"security",action:"OWNER_TWO_STEP_ENABLED",detail:"Verified account email possession as the owner security step",createdAt:now});
  return NextResponse.json({ok:true,...await status(user.email)});
 }
 return NextResponse.json({error:"Unsupported security action"},{status:400});
}
