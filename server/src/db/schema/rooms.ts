import { time } from "console";
import { create } from "domain";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";


export const rooms = pgTable("rooms", {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text().notNull(),
    desciption: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(), 
})