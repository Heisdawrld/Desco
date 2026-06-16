// Netlify Function: DESCO 2.0 API
// ------------------------------------------------------------------
// Changes in this revision:
//   1. Turso authToken is now REQUIRED and read from TURSO_AUTH_TOKEN.
//      Without it, libsql cannot reach a remote Turso DB. We fail loud
//      instead of silently falling back to a local file (which used to
//      lose every registration on the next cold start).
//   2. DATABASE_URL is also REQUIRED — no more "file:local.db" fallback.
//   3. On first cold start, the function runs idempotent
//      CREATE TABLE IF NOT EXISTS for the two tables it touches
//      (registrants, admin_sessions). Safe to run repeatedly.
//   4. Errors now log the full message and, when NODE_ENV !== "production",
//      surface it in the response so debugging is possible.
//   5. Removed the generic "Internal server error" mask.
// ------------------------------------------------------------------

const { drizzle } = require("drizzle-orm/libsql");
const { createClient } = require("@libsql/client");
const { sqliteTable, text, integer } = require("drizzle-orm/sqlite-core");
const { eq } = require("drizzle-orm");
const { z } = require("zod");
const crypto = require("crypto");
const { Resend } = require("resend");

// ── Env validation ──────────────────────────────────────────────────────────

// Read Turso env vars using the standard naming convention
// (matches the Netlify env the user already has configured).
// We fall back to DATABASE_URL for anyone who set it that way.
const TURSO_DATABASE_URL =
  process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const IS_PROD = process.env.NODE_ENV === "production";

if (!TURSO_DATABASE_URL) {
  throw new Error(
    "TURSO_DATABASE_URL (or DATABASE_URL) is not set. Configure it in the Netlify dashboard (Site settings → Environment variables).",
  );
}
if (!TURSO_AUTH_TOKEN) {
  throw new Error(
    "TURSO_AUTH_TOKEN is not set. Configure it in the Netlify dashboard (Site settings → Environment variables). Get it from https://app.turso.tech → your DB → Settings → Tokens.",
  );
}

// ── DB client ───────────────────────────────────────────────────────────────

const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
const db = drizzle(client);

// ── Schema ──────────────────────────────────────────────────────────────────

const registrantTable = sqliteTable("registrants", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["contestant", "audience"] }).notNull(),
  name: text("name").notNull(),
  matric: text("matric"),
  department: text("department").notNull(),
  level: text("level").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  passportBase64: text("passport_base64"),
  registeredAt: text("registered_at").notNull(),
});

const adminSessionTable = sqliteTable("admin_sessions", {
  token: text("token").primaryKey(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

// Idempotent schema bootstrap — runs once per cold start instance.
let _schemaReady = null;
async function ensureSchema() {
  if (_schemaReady) return _schemaReady;
  _schemaReady = (async () => {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS registrants (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          matric TEXT,
          department TEXT NOT NULL,
          level TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT NOT NULL,
          passport_base64 TEXT,
          registered_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS admin_sessions (
          token TEXT PRIMARY KEY,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )`,
      ],
      "write",
    );
    console.log("[api] schema bootstrap complete");
  })();
  return _schemaReady;
}

// ── Validation ──────────────────────────────────────────────────────────────

const RegistrantSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["contestant", "audience"]),
  name: z.string().min(1),
  matric: z.string().optional(),
  department: z.string().min(1),
  level: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  passportBase64: z.string().nullable().optional(),
  registeredAt: z.string().datetime(),
});

// ── Email (Resend) ──────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = "davidchuks229@gmail.com";

async function sendRegistrationEmail(registrant) {
  if (!resend) {
    console.log("[api] RESEND_API_KEY not set — skipping email");
    return;
  }
  const isContestant = registrant.type === "contestant";
  const subject = isContestant
    ? `New Contestant Registration - ${registrant.name}`
    : `New Audience Registration - ${registrant.name}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a1a; border-bottom: 3px solid #e11d48; padding-bottom: 10px;">
        ${isContestant ? "New Contestant Registration" : "New Audience Registration"}
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600; width: 140px;">Full Name</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.name}</td></tr>
        ${isContestant ? `<tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Matric Number</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.matric || "—"}</td></tr>` : ""}
        <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Cohort</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.department}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Level</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.level}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Phone</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.phone}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.email}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Registered At</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${new Date(registrant.registeredAt).toLocaleString()}</td></tr>
      </table>
      <p style="margin-top: 30px; color: #666; font-size: 13px;">
        This registration has been saved to the database.<br>
        <strong>DESCO 2.0 Admin Notification</strong>
      </p>
    </div>`;
  try {
    await resend.emails.send({
      from: "DESCO 2.0 <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    console.log(`[api] email sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error("[api] email send failed:", err);
  }
}

// ── Response helpers ────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function jsonResponse(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

function errorResponse(statusCode, message, detail) {
  // In dev, include the real error. In prod, keep it terse but log full detail.
  if (!IS_PROD && detail) return jsonResponse(statusCode, { error: message, detail });
  return jsonResponse(statusCode, { error: message });
}

// ── Handler ─────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "desco2026";

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  const path = event.path.replace("/.netlify/functions/api", "");
  const method = event.httpMethod;

  try {
    // Always make sure the schema exists before any DB op.
    await ensureSchema();

    // ── Health ──
    if (path === "/healthz" && method === "GET") {
      return jsonResponse(200, { status: "ok", ts: Date.now() });
    }

    // ── Registrants ──
    if (path === "/registrants") {
      if (method === "GET") {
        const rows = await db.select().from(registrantTable).orderBy(registrantTable.registeredAt);
        return jsonResponse(200, rows);
      }

      if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        const parsed = RegistrantSchema.parse(body);
        const [inserted] = await db.insert(registrantTable).values(parsed).returning();
        // Fire-and-forget email
        sendRegistrationEmail(inserted).catch((e) => console.error("[api] email err", e));
        return jsonResponse(201, inserted);
      }

      if (method === "DELETE") {
        await db.delete(registrantTable);
        return jsonResponse(204, {});
      }
    }

    if (path.startsWith("/registrants/") && method === "DELETE") {
      const id = path.split("/")[2];
      await db.delete(registrantTable).where(eq(registrantTable.id, id));
      return jsonResponse(204, {});
    }

    // ── Admin login ──
    if (path === "/admin/login" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (body.password !== ADMIN_PASSWORD) {
        return errorResponse(401, "Invalid password");
      }
      const token = crypto.randomBytes(32).toString("hex");
      const now = Date.now();
      const expiresAt = now + 1000 * 60 * 60 * 24;
      await db.insert(adminSessionTable).values({ token, createdAt: now, expiresAt });
      return jsonResponse(200, { token, expiresAt });
    }

    return errorResponse(404, "Not found", `No route for ${method} ${path}`);
  } catch (err) {
    console.error("[api] error:", err);
    if (err instanceof z.ZodError) {
      return errorResponse(400, "Validation failed", err.issues);
    }
    return errorResponse(500, "Internal server error", err.message);
  }
};
