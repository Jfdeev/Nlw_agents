import { 
    pgTable,
    text,
    timestamp,
    uuid
 } from "drizzle-orm/pg-core";
import { id } from "zod/v4/locales";
import { rooms } from "./rooms.ts";

export const questions = pgTable("questions", {
    id: uuid().primaryKey().defaultRandom(),
    roomId: uuid().notNull().references(() => rooms.id),
    question: text().notNull(),
    answer: text(),
    createdAt: timestamp().defaultNow().notNull(),
})