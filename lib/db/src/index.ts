import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:local.db";

export const db = drizzle(createClient({ url }), { schema });

export * from "./schema";
