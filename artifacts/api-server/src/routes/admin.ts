import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adminSessionTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "desco2026";

// Simple token-based login (demo)
router.post("/login", async (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24; // 24 hours

  await db.insert(adminSessionTable).values({
    token,
    createdAt: now,
    expiresAt,
  });

  res.json({ token, expiresAt });
});

export default router;
