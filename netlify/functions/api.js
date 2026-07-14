// Netlify Function: DESCO 2.0 API
// ------------------------------------------------------------------
// Security model (Pass 1 rewrite):
//   1. Public routes:  GET /healthz, GET /scores, GET /news,
//                      POST /registrants (type=audience only),
//                      POST /admin/login, POST /admin/logout
//   2. Admin-only:     GET /registrants (contains PII),
//                      POST /registrants (type=contestant),
//                      DELETE /registrants, DELETE /registrants/:id,
//                      PUT /scores, POST /scores/reset,
//                      POST /news, DELETE /news/:id
//   3. Auth:           Bearer token in Authorization header,
//                      validated against admin_sessions table.
//                      Tokens expire after 24h and are cleaned up on use.
//   4. CORS:           Restricted to origins listed in CORS_ALLOWED_ORIGINS
//                      (comma-separated). Defaults to localhost dev ports.
//   5. Password:       ADMIN_PASSWORD is REQUIRED in production.
//                      In dev, falls back to "desco2026" for convenience.
// ------------------------------------------------------------------

const { drizzle } = require("drizzle-orm/libsql");
const { createClient } = require("@libsql/client");
const { sqliteTable, text, integer } = require("drizzle-orm/sqlite-core");
const { eq, desc } = require("drizzle-orm");
const { z } = require("zod");
const crypto = require("crypto");
const { Resend } = require("resend");

// ── Env validation ──────────────────────────────────────────────────────────

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

// ADMIN_PASSWORD must be set in production. In dev, allow a fallback.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DEV_PASSWORD = "desco2026";
if (IS_PROD && !ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_PASSWORD is not set. Configure a strong password in the Netlify dashboard before deploying to production.",
  );
}
const EFFECTIVE_PASSWORD = ADMIN_PASSWORD || DEV_PASSWORD;

// CORS allowlist. Set CORS_ALLOWED_ORIGINS in Netlify env to your production
// domain(s). The new domain is included as a fallback so the site works even
// if the env var is forgotten — but you SHOULD still set it explicitly.
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ||
  "http://localhost:5173,http://localhost:3000,http://localhost:4173,https://ulsesadesco.online,https://www.ulsesadesco.online")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

const cohortScoreTable = sqliteTable("cohort_scores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sprint: integer("sprint").notNull().default(0),
  clash: integer("clash").notNull().default(0),
  specialist: integer("specialist").notNull().default(0),
  puzzle: integer("puzzle").notNull().default(0),
  buzzer: integer("buzzer").notNull().default(0),
  blackout: integer("blackout").notNull().default(0),
});

const newsTable = sqliteTable("news", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
});

const DEFAULT_SCORES = [
  { id: "biology", name: "Biology Education", sprint: 480, clash: 520, specialist: 610, puzzle: 440, buzzer: 470, blackout: 330 },
  { id: "chemistry", name: "Chemistry Education", sprint: 450, clash: 490, specialist: 580, puzzle: 410, buzzer: 450, blackout: 340 },
  { id: "physics", name: "Physics Education", sprint: 460, clash: 470, specialist: 550, puzzle: 430, buzzer: 440, blackout: 230 },
  { id: "mathematics", name: "Mathematics Education", sprint: 420, clash: 460, specialist: 520, puzzle: 470, buzzer: 420, blackout: 250 },
  { id: "integratedscience", name: "Integrated Science", sprint: 390, clash: 420, specialist: 460, puzzle: 380, buzzer: 390, blackout: 250 },
];

const DEFAULT_NEWS = [
  { id: "1", date: "May 25, 2026", title: "Registration Opens for DESCO 2.0", body: "Contestant and audience registration is now live. All Science Education departments are encouraged to register their best representatives before the deadline." },
  { id: "3", date: "May 15, 2026", title: "New Round Revealed: Blackout Question", body: "DESCO 2.0 introduces the dramatic Blackout Question — a double-or-nothing finale where cohorts wager accumulated points on one final answer." },
];

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
        `CREATE TABLE IF NOT EXISTS cohort_scores (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sprint REAL NOT NULL DEFAULT 0,
          clash REAL NOT NULL DEFAULT 0,
          specialist REAL NOT NULL DEFAULT 0,
          puzzle REAL NOT NULL DEFAULT 0,
          buzzer REAL NOT NULL DEFAULT 0,
          blackout REAL NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS news (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL
        )`,
      ],
      "write",
    );

    // Seed default scores if none exist. Use INSERT OR IGNORE via raw SQL so
    // that two concurrent cold starts don't race and double-insert.
    const existingScores = await db.select().from(cohortScoreTable);
    if (existingScores.length === 0) {
      for (const s of DEFAULT_SCORES) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO cohort_scores (id, name, sprint, clash, specialist, puzzle, buzzer, blackout) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [s.id, s.name, s.sprint, s.clash, s.specialist, s.puzzle, s.buzzer, s.blackout],
        });
      }
    }

    // Seed default news if none exist.
    const existingNews = await db.select().from(newsTable);
    if (existingNews.length === 0) {
      for (const n of DEFAULT_NEWS) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO news (id, date, title, body) VALUES (?, ?, ?, ?)`,
          args: [n.id, n.date, n.title, n.body],
        });
      }
    }

    // Self-healing: delete the erroneous "Computer Science Joins The Lineup"
    // news item from any earlier seed. Science Education has 5 cohorts
    // (Biology, Chemistry, Physics, Mathematics, Integrated Science) — no CS.
    try {
      await db
        .delete(newsTable)
        .where(eq(newsTable.title, "Computer Science Joins The Lineup"));
    } catch (e) {
      console.error("[api] self-healing news delete failed:", e);
    }

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

// ── Event config ────────────────────────────────────────────────────────────
// Centralized so the email templates and any future logic can reference a
// single source of truth. Override via env vars in Netlify.

const EVENT_CONFIG = {
  name: "DESCO 2.0",
  dateLong: process.env.EVENT_DATE_LONG || "Friday, July 17, 2026",
  timeLong: process.env.EVENT_TIME_LONG || "9:00 AM (WAT)",
  venue: process.env.EVENT_VENUE || "Science Education Department, Faculty of Education, University of Lagos, Akoka",
  organizer: "ULSESA — University of Lagos",
  whatsappNumber: process.env.WHATSAPP_NUMBER || "+234 800 000 0000", // ← set real number in Netlify env
  whatsappLink: process.env.WHATSAPP_LINK || "", // optional wa.me/<number> link
  replyTo: process.env.REPLY_TO_EMAIL || "desco@ulsesa.unilag.edu.ng",
};

// Sender address. In dev, Resend's sandbox sender (onboarding@resend.dev) only
// delivers to the account owner. In production, set MAIL_FROM to a verified
// sender on your domain, e.g. "DESCO 2.0 <no-reply@yourdomain.com>".
const MAIL_FROM = process.env.MAIL_FROM || "DESCO 2.0 <onboarding@resend.dev>";

// ── Email (Resend) ──────────────────────────────────────────────────────────

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "davidchuks229@gmail.com";

function waLink() {
  if (EVENT_CONFIG.whatsappLink) return EVENT_CONFIG.whatsappLink;
  const digits = (EVENT_CONFIG.whatsappNumber || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

function emailButton(href, label) {
  return `
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#e11d48);color:#ffffff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:999px;font-size:15px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(124,58,237,0.35);">
      ${label}
    </a>`;
}

function emailShell({ preheader, heroTitle, heroSubtitle, bodyHtml }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>${heroTitle}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;min-width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#111118 0%,#0d0d12 100%);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">

          <!-- Header / Brand -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
              <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#7c3aed,#e11d48);border-radius:14px;line-height:48px;color:#fff;font-weight:800;font-size:18px;letter-spacing:0.5px;margin-bottom:14px;">
                D2
              </div>
              <h1 style="margin:0 0 6px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.5px;">${heroTitle}</h1>
              <p style="margin:0;color:#a1a1aa;font-size:14px;">${heroSubtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;color:#e4e4e7;font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Event details strip -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:14px;">
                <tr><td style="padding:18px 22px;">
                  <p style="margin:0 0 10px;color:#c4b5fd;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Event Details</p>
                  <p style="margin:0 0 6px;color:#ffffff;font-size:14px;"><strong>📅 Date:</strong> ${EVENT_CONFIG.dateLong}</p>
                  <p style="margin:0 0 6px;color:#ffffff;font-size:14px;"><strong>⏰ Time:</strong> ${EVENT_CONFIG.timeLong}</p>
                  <p style="margin:0;color:#ffffff;font-size:14px;"><strong>📍 Venue:</strong> ${EVENT_CONFIG.venue}</p>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:8px 40px 32px;">
              ${emailButton(waLink(), "Contact Us on WhatsApp")}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0 0 8px;color:#71717a;font-size:12px;line-height:1.5;">
                You're receiving this email because you registered for ${EVENT_CONFIG.name}.
              </p>
              <p style="margin:0 0 14px;color:#71717a;font-size:12px;line-height:1.5;">
                Questions? Reply to this email or message us on WhatsApp at <strong style="color:#a1a1aa;">${EVENT_CONFIG.whatsappNumber}</strong>.
              </p>
              <p style="margin:0;color:#52525b;font-size:11px;letter-spacing:0.5px;">
                © ${new Date().getFullYear()} ${EVENT_CONFIG.organizer}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Admin notification (internal) ───────────────────────────────────────────

async function sendAdminNotificationEmail(registrant) {
  if (!resend) {
    console.log("[api] RESEND_API_KEY not set — skipping admin email");
    return;
  }
  const isContestant = registrant.type === "contestant";
  const subject = isContestant
    ? `[DESCO] New Contestant — ${registrant.name}`
    : `[DESCO] New Audience — ${registrant.name}`;
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
        This registration has been saved to the database. A confirmation email has also been sent to the registrant.<br>
        <strong>DESCO 2.0 Admin Notification</strong>
      </p>
    </div>`;
  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: ADMIN_EMAIL,
      replyTo: EVENT_CONFIG.replyTo,
      subject,
      html,
    });
    console.log(`[api] admin notification sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error("[api] admin email send failed:", err);
  }
}

// ── Student confirmation email ──────────────────────────────────────────────

async function sendStudentConfirmationEmail(registrant) {
  if (!resend) {
    console.log("[api] RESEND_API_KEY not set — skipping student email");
    return;
  }

  const isContestant = registrant.type === "contestant";
  const firstName = (registrant.name || "there").split(" ")[0];

  let subject, preheader, heroTitle, heroSubtitle, bodyHtml;

  if (isContestant) {
    subject = `You're In — ${EVENT_CONFIG.name} Contestant Confirmation`;
    preheader = `Congratulations ${firstName}! Your contestant registration for ${EVENT_CONFIG.name} is confirmed. See event details inside.`;
    heroTitle = "Contestant Registration Confirmed";
    heroSubtitle = `Congratulations, ${firstName}. You're officially in the arena.`;
    bodyHtml = `
      <p style="margin:0 0 16px;">Hi <strong>${registrant.name}</strong>,</p>
      <p style="margin:0 0 16px;">
        Your registration as a <strong style="color:#c4b5fd;">contestant</strong> for
        <strong>${EVENT_CONFIG.name}</strong> has been received and confirmed. You're now
        officially representing your cohort in the ultimate intellectual showdown.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin:20px 0;">
        <tr><td style="padding:18px 22px;">
          <p style="margin:0 0 10px;color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your Registration</p>
          <p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Name:</strong> ${registrant.name}</p>
          ${registrant.matric ? `<p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Matric No:</strong> ${registrant.matric}</p>` : ""}
          <p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Cohort:</strong> ${registrant.department}</p>
          <p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Level:</strong> ${registrant.level}</p>
          <p style="margin:0;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Email:</strong> ${registrant.email}</p>
        </td></tr>
      </table>

      <p style="margin:20px 0 12px;color:#ffffff;font-size:16px;font-weight:700;">What happens next?</p>
      <ol style="margin:0 0 16px;padding-left:22px;color:#e4e4e7;font-size:14px;line-height:1.8;">
        <li>The organizing team will reach out via WhatsApp with your contestant brief, event schedule, and round-specific rules.</li>
        <li>Arrive at the venue <strong>by 8:00 AM</strong> on event day for check-in. Bring a valid student ID.</li>
        <li>Six rounds await: Academic Sprint, Cross-Discipline Clash, Specialist Round, Puzzle &amp; Logic Arena, Buzzer War, and the Blackout Question finale.</li>
        <li>If you have any questions before then, message us on WhatsApp — we typically respond within a few hours.</li>
      </ol>

      <p style="margin:24px 0 0;padding:16px;background:rgba(225,29,72,0.1);border-left:3px solid #e11d48;border-radius:6px;color:#fecdd3;font-size:14px;font-style:italic;">
        "Dominate or Don't Show Up." — We'll see you on the battlefield.
      </p>`;
  } else {
    subject = `Seat Reserved — ${EVENT_CONFIG.name} Audience Confirmation`;
    preheader = `See you at ${EVENT_CONFIG.name}! Your audience seat is confirmed. Event details and what to expect inside.`;
    heroTitle = "Your Seat Is Reserved";
    heroSubtitle = `See you at the showdown, ${firstName}.`;
    bodyHtml = `
      <p style="margin:0 0 16px;">Hi <strong>${registrant.name}</strong>,</p>
      <p style="margin:0 0 16px;">
        Your <strong style="color:#c4b5fd;">audience registration</strong> for
        <strong>${EVENT_CONFIG.name}</strong> is confirmed. Get ready to witness
        five cohorts battle through six intense rounds of intellectual combat —
        it's going to be electric.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin:20px 0;">
        <tr><td style="padding:18px 22px;">
          <p style="margin:0 0 10px;color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your Registration</p>
          <p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Name:</strong> ${registrant.name}</p>
          <p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Cohort:</strong> ${registrant.department}</p>
          <p style="margin:0 0 6px;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Level:</strong> ${registrant.level}</p>
          <p style="margin:0;color:#e4e4e7;font-size:14px;"><strong style="display:inline-block;width:130px;color:#a1a1aa;">Email:</strong> ${registrant.email}</p>
        </td></tr>
      </table>

      <p style="margin:20px 0 12px;color:#ffffff;font-size:16px;font-weight:700;">What to expect</p>
      <ul style="margin:0 0 16px;padding-left:22px;color:#e4e4e7;font-size:14px;line-height:1.8;">
        <li>Doors open at <strong>8:00 AM</strong>. Seating is first-come, first-served — arrive early to grab the best spot.</li>
        <li>Six rounds of competition, from the Academic Sprint to the dramatic Blackout Question finale.</li>
        <li>Cheer for your cohort, witness the championship unfold live, and be part of the energy.</li>
        <li>Questions before the event? Message us on WhatsApp and we'll be happy to help.</li>
      </ul>

      <p style="margin:24px 0 0;padding:16px;background:rgba(124,58,237,0.1);border-left:3px solid #7c3aed;border-radius:6px;color:#c4b5fd;font-size:14px;font-style:italic;">
        Bring your energy. The arena awaits.
      </p>`;
  }

  const html = emailShell({ preheader, heroTitle, heroSubtitle, bodyHtml });

  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: registrant.email,
      replyTo: EVENT_CONFIG.replyTo,
      subject,
      html,
    });
    console.log(`[api] student confirmation sent to ${registrant.email}`);
  } catch (err) {
    // Log but don't fail the registration. Common cause: MAIL_FROM is the
    // Resend sandbox sender and the recipient isn't the account owner.
    console.error(`[api] student email to ${registrant.email} failed:`, err.message || err);
  }
}

// ── CORS & Response helpers ─────────────────────────────────────────────────

function getCorsHeaders(origin) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
  // Reflect the origin only if it's on the allowlist; otherwise omit the
  // Access-Control-Allow-Origin header entirely (browser will block).
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

function jsonResponse(statusCode, body, origin) {
  return { statusCode, headers: getCorsHeaders(origin), body: JSON.stringify(body) };
}

function errorResponse(statusCode, message, detail, origin) {
  if (!IS_PROD && detail) return jsonResponse(statusCode, { error: message, detail }, origin);
  return jsonResponse(statusCode, { error: message }, origin);
}

// ── Auth ────────────────────────────────────────────────────────────────────

/**
 * Validate the Bearer token in the Authorization header against admin_sessions.
 * Returns true if valid & non-expired, false otherwise. Also cleans up the
 * token row if expired (best-effort, non-blocking).
 */
async function authenticate(event) {
  const authHeader =
    event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return false;

  const rows = await db
    .select()
    .from(adminSessionTable)
    .where(eq(adminSessionTable.token, token))
    .limit(1);

  if (rows.length === 0) return false;

  const session = rows[0];
  const now = Date.now();
  if (session.expiresAt < now) {
    // Expired — delete it so it can't be reused.
    db.delete(adminSessionTable)
      .where(eq(adminSessionTable.token, token))
      .catch(() => {});
    return false;
  }
  return true;
}

// ── Handler ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log(`[api] ${event.httpMethod} ${event.path}`);
  const origin = event.headers.origin || event.headers.Origin || "";

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: getCorsHeaders(origin), body: "" };
  }

  const path = event.path
    .replace("/.netlify/functions/api", "")
    .replace("/api", "");
  const method = event.httpMethod;

  // Per-request response helpers that close over the origin.
  const json = (code, body) => jsonResponse(code, body, origin);
  const err = (code, msg, detail) => errorResponse(code, msg, detail, origin);

  // Returns null if authed, otherwise returns a 401 response.
  const requireAuth = async () => {
    const ok = await authenticate(event);
    return ok ? null : err(401, "Unauthorized");
  };

  try {
    // Always make sure the schema exists before any DB op.
    await ensureSchema();

    // ── Health (public) ──
    if (path === "/healthz" && method === "GET") {
      return json(200, { status: "ok", ts: Date.now() });
    }

    // ── Registrants ──
    if (path === "/registrants") {
      if (method === "GET") {
        // Contains PII (emails, phones, passport photos) → admin only.
        const authErr = await requireAuth();
        if (authErr) return authErr;
        // Newest-first so the admin sees the latest registrations on top.
        const rows = await db
          .select()
          .from(registrantTable)
          .orderBy(desc(registrantTable.registeredAt));
        return json(200, rows);
      }

      if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        // Contestant registrations require admin auth.
        // Audience registrations are public.
        if (body.type === "contestant") {
          const authErr = await requireAuth();
          if (authErr) return authErr;
        }
        const parsed = RegistrantSchema.parse(body);
        const [inserted] = await db.insert(registrantTable).values(parsed).returning();
        // Fire-and-forget: notify admin AND send confirmation to the student.
        // Both are best-effort — a failure here must not fail the registration.
        Promise.all([
          sendAdminNotificationEmail(inserted).catch((e) =>
            console.error("[api] admin email err:", e),
          ),
          sendStudentConfirmationEmail(inserted).catch((e) =>
            console.error("[api] student email err:", e),
          ),
        ]).catch(() => {});
        return json(201, inserted);
      }

      if (method === "DELETE") {
        const authErr = await requireAuth();
        if (authErr) return authErr;
        await db.delete(registrantTable);
        return json(204, {});
      }
    }

    if (path.startsWith("/registrants/") && method === "DELETE") {
      const authErr = await requireAuth();
      if (authErr) return authErr;
      const id = path.split("/")[2];
      await db.delete(registrantTable).where(eq(registrantTable.id, id));
      return json(204, {});
    }

    // ── Scores ──
    if (path === "/scores") {
      if (method === "GET") {
        // Public — the live scoreboard needs this.
        const rows = await db.select().from(cohortScoreTable);
        return json(200, rows);
      }

      if (method === "PUT") {
        const authErr = await requireAuth();
        if (authErr) return authErr;
        const body = JSON.parse(event.body || "{}");
        const { scores } = body;
        if (!Array.isArray(scores)) {
          return err(400, "Invalid request body");
        }

        // Update each score one by one
        for (const score of scores) {
          await db.update(cohortScoreTable)
            .set({
              sprint: score.sprint,
              clash: score.clash,
              specialist: score.specialist,
              puzzle: score.puzzle,
              buzzer: score.buzzer,
              blackout: score.blackout,
            })
            .where(eq(cohortScoreTable.id, score.id));
        }

        const updatedScores = await db.select().from(cohortScoreTable);
        return json(200, updatedScores);
      }
    }

    if (path === "/scores/reset" && method === "POST") {
      const authErr = await requireAuth();
      if (authErr) return authErr;
      await db.delete(cohortScoreTable);
      await db.insert(cohortScoreTable).values(DEFAULT_SCORES);
      const resetScores = await db.select().from(cohortScoreTable);
      return json(200, resetScores);
    }

    // ── News ──
    if (path === "/news") {
      if (method === "GET") {
        // Public — news is shown on the public home page.
        // Sort newest-first by parsing the display date string (e.g. "May 25, 2026").
        const rows = await db.select().from(newsTable);
        rows.sort((a, b) => {
          const da = new Date(a.date).getTime() || 0;
          const db2 = new Date(b.date).getTime() || 0;
          return db2 - da;
        });
        return json(200, rows);
      }

      if (method === "POST") {
        const authErr = await requireAuth();
        if (authErr) return authErr;
        const body = JSON.parse(event.body || "{}");
        const newItem = {
          id: crypto.randomUUID(),
          date: body.date,
          title: body.title,
          body: body.body,
        };
        await db.insert(newsTable).values(newItem);
        return json(201, newItem);
      }
    }

    if (path.startsWith("/news/") && method === "DELETE") {
      const authErr = await requireAuth();
      if (authErr) return authErr;
      const id = path.split("/")[2];
      await db.delete(newsTable).where(eq(newsTable.id, id));
      return json(204, {});
    }

    // ── Admin login (public) ──
    if (path === "/admin/login" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.password || body.password !== EFFECTIVE_PASSWORD) {
        return err(401, "Invalid password");
      }
      const token = crypto.randomBytes(32).toString("hex");
      const now = Date.now();
      const expiresAt = now + 1000 * 60 * 60 * 24; // 24 hours
      await db.insert(adminSessionTable).values({ token, createdAt: now, expiresAt });
      return json(200, { token, expiresAt });
    }

    // ── Admin logout (public, but only acts on the provided token) ──
    if (path === "/admin/logout" && method === "POST") {
      const authHeader =
        event.headers.authorization || event.headers.Authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        if (token) {
          await db.delete(adminSessionTable).where(eq(adminSessionTable.token, token));
        }
      }
      return json(200, { ok: true });
    }

    return err(404, "Not found", `No route for ${method} ${path}`);
  } catch (error) {
    console.error("[api] error:", error);
    if (error instanceof z.ZodError) {
      return err(400, "Validation failed", error.issues);
    }
    return err(500, "Internal server error", error.message);
  }
};
