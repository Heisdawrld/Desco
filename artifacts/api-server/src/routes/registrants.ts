import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { registrantTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

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

router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(registrantTable).orderBy(registrantTable.registeredAt);
    res.json(rows);
  } catch (err) {
    console.error("GET /registrants error", err);
    res.status(500).json({ error: "Failed to fetch registrants" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = RegistrantSchema.parse(req.body);
    const [inserted] = await db
      .insert(registrantTable)
      .values(parsed)
      .returning();
    res.status(201).json(inserted);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", issues: err.issues });
    }
    console.error("POST /registrants error", err);
    res.status(500).json({ error: "Failed to create registrant" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(registrantTable).where(eq(registrantTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /registrants/:id error", err);
    res.status(500).json({ error: "Failed to delete registrant" });
  }
});

router.delete("/", async (_req, res) => {
  try {
    await db.delete(registrantTable);
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /registrants error", err);
    res.status(500).json({ error: "Failed to clear registrants" });
  }
});

export default router;
