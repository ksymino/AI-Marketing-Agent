import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Marketing campaigns table
 * Stores campaign configuration and metadata
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  campaignBrief: text("campaignBrief").notNull(),
  budget: int("budget").notNull(), // in cents to avoid decimal issues
  targetPlatforms: text("targetPlatforms").notNull(), // JSON array of platforms
  targetKpis: text("targetKpis"), // JSON object of KPIs
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  status: mysqlEnum("status", ["pending", "analyzing", "generating", "executing", "completed", "failed"]).default("pending").notNull(),
  workflowId: varchar("workflowId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Campaign results table
 * Stores complete workflow results including brand analysis, content, and performance
 */
export const campaignResults = mysqlTable("campaignResults", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull().references(() => campaigns.id),
  brandAnalysis: text("brandAnalysis"), // JSON of brand profile and SWOT
  contentAssets: text("contentAssets"), // JSON array of generated content
  visualAssets: text("visualAssets"), // JSON array of visual prompts
  generatedImages: text("generatedImages"), // JSON array of actual generated image URLs
  kolRecommendations: text("kolRecommendations"), // JSON array of KOL recommendations
  campaignPlan: text("campaignPlan"), // JSON of budget allocation and strategy
  performanceMetrics: text("performanceMetrics"), // JSON of performance data
  optimizationFeedback: text("optimizationFeedback"), // JSON of insights and recommendations
  executionTime: int("executionTime"), // in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignResult = typeof campaignResults.$inferSelect;
export type InsertCampaignResult = typeof campaignResults.$inferInsert;