import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const kycApplications = sqliteTable("kyc_applications", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull(),
  userEmail: text("user_email").notNull(),
  userDisplayName: text("user_display_name").notNull(),
  fullName: text("full_name").notNull(),
  birthYear: integer("birth_year").notNull(),
  nationality: text("nationality").notNull(),
  panLast4: text("pan_last4").notNull(),
  mobileLast4: text("mobile_last4").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  idType: text("id_type").notNull(),
  evidenceSummary: text("evidence_summary").notNull(),
  status: text("status").notNull().default("pending"),
  riskLevel: text("risk_level").notNull().default("unrated"),
  reviewNote: text("review_note"),
  reviewChecks: text("review_checks").notNull().default("[]"),
  reviewedBy: text("reviewed_by"),
  submittedAt: integer("submitted_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  reviewedAt: integer("reviewed_at"),
}, (table) => [
  uniqueIndex("idx_kyc_applications_user_email").on(table.userEmail),
  uniqueIndex("idx_kyc_applications_reference").on(table.reference),
  index("idx_kyc_applications_status_updated").on(table.status, table.updatedAt),
]);

export const kycReviewEvents = sqliteTable("kyc_review_events", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  note: text("note"),
  checks: text("checks").notNull().default("[]"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("idx_kyc_review_events_application_created").on(table.applicationId, table.createdAt),
]);

export const paperAccounts = sqliteTable("paper_accounts", {
  userEmail: text("user_email").primaryKey(),
  displayName: text("display_name").notNull(),
  balancePaise: integer("balance_paise").notNull().default(1000000),
  startingBalancePaise: integer("starting_balance_paise").notNull().default(1000000),
  mode: text("mode").notNull().default("copilot"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const paperSettings = sqliteTable("paper_settings", {
  userEmail: text("user_email").primaryKey(),
  capitalPaise: integer("capital_paise").notNull().default(1000000),
  maxRiskPct: real("max_risk_pct").notNull().default(1),
  dailyLossPct: real("daily_loss_pct").notNull().default(3),
  maxPositions: integer("max_positions").notNull().default(2),
  minConfidence: integer("min_confidence").notNull().default(80),
  stopLossRequired: integer("stop_loss_required",{mode:"boolean"}).notNull().default(true),
  takeProfitRequired: integer("take_profit_required",{mode:"boolean"}).notNull().default(true),
  dailyStopRequired: integer("daily_stop_required",{mode:"boolean"}).notNull().default(true),
  volatilityProtection: integer("volatility_protection",{mode:"boolean"}).notNull().default(true),
  tradeAlerts: integer("trade_alerts",{mode:"boolean"}).notNull().default(true),
  aiAlerts: integer("ai_alerts",{mode:"boolean"}).notNull().default(true),
  lossAlerts: integer("loss_alerts",{mode:"boolean"}).notNull().default(true),
  weeklyReport: integer("weekly_report",{mode:"boolean"}).notNull().default(false),
  emergencyStop: integer("emergency_stop",{mode:"boolean"}).notNull().default(false),
  autoTestnetEnabled: integer("auto_testnet_enabled",{mode:"boolean"}).notNull().default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const paperTrades = sqliteTable("paper_trades", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  asset: text("asset").notNull(),
  side: text("side").notNull(),
  amountPaise: integer("amount_paise").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopPrice: real("stop_price").notNull(),
  targetPrice: real("target_price").notNull(),
  status: text("status").notNull().default("open"),
  pnlPaise: integer("pnl_paise").notNull().default(0),
  exitPrice: real("exit_price"),
  closedAt: integer("closed_at"),
  createdAt: integer("created_at").notNull(),
});

export const aiDecisions = sqliteTable("ai_decisions", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  asset: text("asset").notNull(),
  decision: text("decision").notNull(),
  confidence: integer("confidence").notNull(),
  reasons: text("reasons").notNull(),
  indicators: text("indicators").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopPrice: real("stop_price"),
  targetPrice: real("target_price"),
  createdAt: integer("created_at").notNull(),
});

export const exchangeConnections = sqliteTable("exchange_connections", {
  userEmail: text("user_email").primaryKey(),
  exchange: text("exchange").notNull().default("binance"),
  environment: text("environment").notNull().default("testnet"),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  credentialIv: text("credential_iv").notNull(),
  apiKeyHint: text("api_key_hint").notNull(),
  canTrade: integer("can_trade", { mode: "boolean" }).notNull().default(false),
  permissions: text("permissions").notNull().default("[]"),
  balances: text("balances").notNull().default("[]"),
  status: text("status").notNull().default("connected"),
  connectedAt: integer("connected_at").notNull(),
  lastCheckedAt: integer("last_checked_at").notNull(),
});

export const testnetOrders = sqliteTable("testnet_orders", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  asset: text("asset").notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull().default("BUY"),
  source: text("source").notNull().default("manual"),
  status: text("status").notNull().default("pending"),
  binanceStatus: text("binance_status").notNull().default("PENDING"),
  clientOrderId: text("client_order_id").notNull(),
  binanceOrderId: text("binance_order_id"),
  protectionOrderListId: text("protection_order_list_id"),
  quoteAmount: real("quote_amount").notNull(),
  quantity: real("quantity").notNull().default(0),
  entryPrice: real("entry_price").notNull(),
  stopPrice: real("stop_price").notNull(),
  targetPrice: real("target_price").notNull(),
  exitPrice: real("exit_price"),
  pnlQuote: real("pnl_quote").notNull().default(0),
  confidence: integer("confidence").notNull(),
  error: text("error"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  closedAt: integer("closed_at"),
});

export const tradingEvents = sqliteTable("trading_events", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  category: text("category").notNull(),
  action: text("action").notNull(),
  entityId: text("entity_id"),
  detail: text("detail").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const appUsers = sqliteTable("app_users", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  // Stored per user so the work factor can be raised without locking anyone out.
  passwordIterations: integer("password_iterations").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// The cookie carries a random token; only its SHA-256 digest is stored, so a
// database copy cannot be replayed as a live session.
export const appSessions = sqliteTable("app_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userEmail: text("user_email").notNull(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("idx_app_sessions_user_email").on(table.userEmail),
  index("idx_app_sessions_expires_at").on(table.expiresAt),
]);

// Failed-attempt counters for sign-in and registration. Keyed by email and by
// client IP separately, so one attacker cannot spray many emails from one
// address and one email cannot be locked out from many addresses cheaply.
export const authThrottle = sqliteTable("auth_throttle", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull(),
  firstFailureAt: integer("first_failure_at").notNull(),
  lockedUntil: integer("locked_until").notNull().default(0),
}, (table) => [
  index("idx_auth_throttle_locked_until").on(table.lockedUntil),
]);
