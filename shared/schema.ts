import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['visitor', 'agent']);

// Enum for ticket status
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'pending', 'solved']);

// Enum for ticket priority
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'normal', 'high']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default('visitor'),
  clerkId: text("clerk_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  articles: many(articles),
}));

// Categories for knowledge base articles
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // Font Awesome icon class
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Category relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

// Knowledge base articles
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown content
  authorId: integer("author_id").references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  isPublished: boolean("is_published").default(true).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Article relations
export const articlesRelations = relations(articles, ({ one }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
}));

// Article embedding for vector search
export const articleEmbeddings = pgTable("article_embeddings", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  embedding: text("embedding").notNull(), // Vector embedding stored as text, will be converted to pgvector
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Article embedding relations
export const articleEmbeddingsRelations = relations(articleEmbeddings, ({ one }) => ({
  article: one(articles, {
    fields: [articleEmbeddings.articleId],
    references: [articles.id],
  }),
}));

// Support tickets
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default('open').notNull(),
  priority: ticketPriorityEnum("priority").default('normal').notNull(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  assigneeId: integer("assignee_id").references(() => users.id),
  orderNumber: text("order_number"), // Optional order reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ticket relations
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  requester: one(users, {
    fields: [tickets.requesterId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
  }),
  messages: many(ticketMessages),
  files: many(ticketFiles),
}));

// Ticket messages (conversation thread)
export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  authorId: integer("author_id").references(() => users.id),
  content: text("content").notNull(),
  isFromAI: boolean("is_from_ai").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ticket message relations
export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [ticketMessages.authorId],
    references: [users.id],
  }),
}));

// File attachments for tickets
export const ticketFiles = pgTable("ticket_files", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ticket file relations
export const ticketFilesRelations = relations(ticketFiles, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketFiles.ticketId],
    references: [tickets.id],
  }),
}));

// Chat sessions for AI assistance
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat session relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

// Messages in AI chat sessions
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  content: text("content").notNull(),
  isFromUser: boolean("is_from_user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat message relations
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

// Macros for quick agent responses
export const macros = pgTable("macros", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Macro relations
export const macrosRelations = relations(macros, ({ one }) => ({
  createdBy: one(users, {
    fields: [macros.createdById],
    references: [users.id],
  }),
}));

// Analytics for ticket metrics
export const ticketAnalytics = pgTable("ticket_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  ticketVolume: integer("ticket_volume").notNull(),
  avgResolutionTime: integer("avg_resolution_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export const insertArticleEmbeddingSchema = createInsertSchema(articleEmbeddings).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true, status: true, assigneeId: true });
export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({ id: true, createdAt: true });
export const insertTicketFileSchema = createInsertSchema(ticketFiles).omit({ id: true, createdAt: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertMacroSchema = createInsertSchema(macros).omit({ id: true, createdAt: true });
export const insertTicketAnalyticsSchema = createInsertSchema(ticketAnalytics).omit({ id: true, createdAt: true });

// Define types for inserting and selecting
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type InsertArticleEmbedding = z.infer<typeof insertArticleEmbeddingSchema>;
export type ArticleEmbedding = typeof articleEmbeddings.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;

export type InsertTicketFile = z.infer<typeof insertTicketFileSchema>;
export type TicketFile = typeof ticketFiles.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertMacro = z.infer<typeof insertMacroSchema>;
export type Macro = typeof macros.$inferSelect;

export type InsertTicketAnalytics = z.infer<typeof insertTicketAnalyticsSchema>;
export type TicketAnalytics = typeof ticketAnalytics.$inferSelect;
