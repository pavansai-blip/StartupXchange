import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"),
  name: varchar("name", { length: 160 }).notNull(),
  startup: varchar("startup", { length: 160 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: text("description").notNull(),
  tech: text("tech").notNull(),
  status: varchar("status", { length: 64 }).default("OPEN FOR ACQUISITION").notNull(),
  revenue: varchar("revenue", { length: 80 }).notNull(),
  users: varchar("users", { length: 80 }).notNull(),
  price: varchar("price", { length: 80 }).notNull(),
  acquisitionType: varchar("acquisitionType", { length: 100 }).notNull(),
  color: varchar("color", { length: 24 }).default("blue").notNull(),
  logo: varchar("logo", { length: 8 }).notNull(),
  isDemo: int("isDemo").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  buyerId: int("buyerId").notNull(),
  offerPrice: varchar("offerPrice", { length: 80 }).notNull(),
  paymentStructure: varchar("paymentStructure", { length: 80 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["SUBMITTED", "NEGOTIATING", "ACCEPTED", "DECLINED"]).default("SUBMITTED").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const savedProjects = mysqlTable("savedProjects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  userProjectUnique: uniqueIndex("savedProjects_user_project_unique").on(table.userId, table.projectId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type SavedProject = typeof savedProjects.$inferSelect;
