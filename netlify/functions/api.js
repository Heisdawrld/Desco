const { drizzle } = require("drizzle-orm/libsql");
const { createClient } = require("@libsql/client");
const { sqliteTable, text, integer } = require("drizzle-orm/sqlite-core");
const { eq } = require("drizzle-orm");
const { z } = require("zod");
const crypto = require("crypto");
const { Resend } = require("resend");

const dbUrl = process.env.DATABASE_URL || "file:local.db";
const db = drizzle(createClient({ url: dbUrl }));

const resend = new Resend(process.env.RESEND_API_KEY || "");
const ADMIN_EMAIL = "davidchuks229@gmail.com";

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

const RegistrantSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["contestant", "audience"]),
  name: z.string().min(1),
  matric: z.string().optional(),
  department: z.string().min(1),
  level: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  passportBase64: z.string().optional(),
  registeredAt: z.string().datetime(),
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "desco2026";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function errorResponse(statusCode, message) {
  return jsonResponse(statusCode, { error: message });
}

async function sendRegistrationEmail(registrant) {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — skipping email");
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
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600; width: 140px;">Full Name</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.name}</td>
        </tr>
        ${isContestant ? `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Matric Number</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.matric || "—"}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Cohort</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.department}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Level</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.level}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Phone</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.phone}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Email</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${registrant.email}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 600;">Registered At</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${new Date(registrant.registeredAt).toLocaleString()}</td>
        </tr>
      </table>

      <p style="margin-top: 30px; color: #666; font-size: 13px;">
        This registration has been saved to the database.<br>
        <strong>DESCO 2.0 Admin Notification</strong>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "DESCO 2.0 <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    console.log(`Email sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  const path = event.path.replace("/.netlify/functions/api", "");
  const method = event.httpMethod;

  try {
    if (path === "/healthz" && method === "GET") {
      return jsonResponse(200, { status: "ok" });
    }

    if (path === "/registrants") {
      if (method === "GET") {
        const rows = await db.select().from(registrantTable).orderBy(registrantTable.registeredAt);
        return jsonResponse(200, rows);
      }

      if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        const parsed = RegistrantSchema.parse(body);

        const [inserted] = await db.insert(registrantTable).values(parsed).returning();

        // Send email (non-blocking)
        sendRegistrationEmail(inserted).catch(console.error);

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

    return errorResponse(404, "Not found");
  } catch (err) {
    console.error("API Error:", err);
    if (err instanceof z.ZodError) {
      return errorResponse(400, "Validation failed");
    }
    return errorResponse(500, "Internal server error");
  }
};
