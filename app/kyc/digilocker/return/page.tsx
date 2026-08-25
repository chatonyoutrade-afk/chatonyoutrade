"use client";

import { useEffect, useState } from "react";

export default function DigiLockerReturnPage() {
  const [state, setState] = useState<"checking" | "completed" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Confirming your DigiLocker consent with Sandbox…");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/kyc/digilocker", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "DigiLocker status could not be checked.");
        if (data.completed) { setState("completed"); setMessage("DigiLocker consent was received. Document matching remains with the authorised reviewer."); }
        else { setState("pending"); setMessage("DigiLocker has not confirmed document consent yet. You can retry the status check."); }
      } catch (reason) { setState("error"); setMessage(reason instanceof Error ? reason.message : "DigiLocker status could not be checked."); }
    })();
  }, []);

  return <main className="system-state-shell compact"><a className="terminal-logo" href="/"><img src="/chatonyou-logo.png" alt="ChatOnYou"/><b>TRADE</b></a><section><div className="system-loader"><i/><i/><i/></div><span>DIGILOCKER CONSENT</span><h1>{state === "checking" ? "Checking securely…" : state === "completed" ? "Consent received." : state === "pending" ? "Consent is still pending." : "Status unavailable."}</h1><p>{message}</p><div className="admin-provider-actions"><a href="/kyc/status">View KYC status</a>{state !== "completed" ? <a href="/kyc/digilocker/return">Check again</a> : null}</div></section></main>;
}
