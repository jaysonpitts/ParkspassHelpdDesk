import {
  User, InsertUser,
  Category, InsertCategory,
  Article, InsertArticle,
  Ticket, InsertTicket,
  TicketMessage, InsertTicketMessage,
  TicketFile, InsertTicketFile,
  ChatSession, InsertChatSession,
  ChatMessage, InsertChatMessage,
  Macro, InsertMacro,
  TicketAnalytics, InsertTicketAnalytics
} from "@shared/schema";

import { db } from "./db";
import { 
  users, categories, articles, tickets, ticketMessages, 
  ticketFiles, chatSessions, chatMessages, macros, 
  ticketAnalytics, articleEmbeddings
} from "@shared/schema";
import { eq, and, like, desc, asc, sql, isNull, not, count } from "drizzle-orm";
import { storeArticleEmbedding } from "./ai";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByClerkId(clerkId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  
  // Article operations
  getAllArticles(onlyPublished?: boolean): Promise<Article[]>;
  getArticleById(id: number): Promise<Article | undefined>;
  getArticlesByCategory(categoryId: number): Promise<Article[]>;
  searchArticles(query: string): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  incrementArticleViews(id: number): Promise<void>;
  
  // Ticket operations
  getAllTickets(): Promise<Ticket[]>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  getTicketsByRequester(requesterId: number): Promise<Ticket[]>;
  getTicketsByAssignee(assigneeId: number): Promise<Ticket[]>;
  getTicketsByStatus(status: 'open' | 'pending' | 'solved'): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicketStatus(id: number, status: 'open' | 'pending' | 'solved'): Promise<Ticket | undefined>;
  assignTicket(id: number, assigneeId: number): Promise<Ticket | undefined>;
  
  // Ticket message operations
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Ticket file operations
  getTicketFiles(ticketId: number): Promise<TicketFile[]>;
  createTicketFile(file: InsertTicketFile): Promise<TicketFile>;
  
  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSessionById(sessionId: string): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: number): Promise<ChatSession[]>;
  
  // Chat message operations
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Macro operations
  getAllMacros(): Promise<Macro[]>;
  getMacroById(id: number): Promise<Macro | undefined>;
  createMacro(macro: InsertMacro): Promise<Macro>;
  
  // Analytics operations
  getTicketAnalytics(startDate: Date, endDate: Date): Promise<TicketAnalytics[]>;
  createTicketAnalytics(analytics: InsertTicketAnalytics): Promise<TicketAnalytics>;
  
  // Dashboard data
  getDashboardStats(): Promise<{
    openTickets: number;
    pendingTickets: number;
    solvedTickets: number;
    totalArticles: number;
    unassignedTickets: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }
  
  // Article operations
  async getAllArticles(onlyPublished: boolean = true): Promise<Article[]> {
    let query = db.select().from(articles);
    
    if (onlyPublished) {
      query = query.where(eq(articles.isPublished, true));
    }
    
    return query.orderBy(desc(articles.updatedAt));
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticlesByCategory(categoryId: number): Promise<Article[]> {
    return db
      .select()
      .from(articles)
      .where(and(
        eq(articles.categoryId, categoryId),
        eq(articles.isPublished, true)
      ))
      .orderBy(desc(articles.updatedAt));
  }

  async searchArticles(query: string): Promise<Article[]> {
    return db
      .select()
      .from(articles)
      .where(and(
        eq(articles.isPublished, true),
        sql`(${articles.title} ILIKE ${`%${query}%`} OR ${articles.content} ILIKE ${`%${query}%`})`
      ))
      .orderBy(desc(articles.updatedAt));
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    
    // Generate and store embedding for search
    await storeArticleEmbedding(newArticle.id, `${newArticle.title} ${newArticle.content}`);
    
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updatedArticle] = await db
      .update(articles)
      .set({
        ...article,
        updatedAt: new Date()
      })
      .where(eq(articles.id, id))
      .returning();
    
    if (updatedArticle) {
      // Update embedding if content or title was changed
      if (article.content || article.title) {
        const fullArticle = await this.getArticleById(id);
        if (fullArticle) {
          await storeArticleEmbedding(id, `${fullArticle.title} ${fullArticle.content}`);
        }
      }
    }
    
    return updatedArticle;
  }

  async incrementArticleViews(id: number): Promise<void> {
    await db
      .update(articles)
      .set({
        viewCount: sql`${articles.viewCount} + 1`
      })
      .where(eq(articles.id, id));
  }
  
  // Ticket operations
  async getAllTickets(): Promise<Ticket[]> {
    return db.select().from(tickets).orderBy(desc(tickets.updatedAt));
  }

  async getTicketById(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketsByRequester(requesterId: number): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(eq(tickets.requesterId, requesterId))
      .orderBy(desc(tickets.updatedAt));
  }

  async getTicketsByAssignee(assigneeId: number): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(eq(tickets.assigneeId, assigneeId))
      .orderBy(desc(tickets.updatedAt));
  }

  async getTicketsByStatus(status: 'open' | 'pending' | 'solved'): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(eq(tickets.status, status))
      .orderBy(desc(tickets.updatedAt));
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicketStatus(id: number, status: 'open' | 'pending' | 'solved'): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async assignTicket(id: number, assigneeId: number): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        assigneeId,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }
  
  // Ticket message operations
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt));
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [newMessage] = await db.insert(ticketMessages).values(message).returning();
    
    // Update the ticket's updatedAt timestamp
    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, message.ticketId));
    
    return newMessage;
  }
  
  // Ticket file operations
  async getTicketFiles(ticketId: number): Promise<TicketFile[]> {
    return db
      .select()
      .from(ticketFiles)
      .where(eq(ticketFiles.ticketId, ticketId))
      .orderBy(desc(ticketFiles.createdAt));
  }

  async createTicketFile(file: InsertTicketFile): Promise<TicketFile> {
    const [newFile] = await db.insert(ticketFiles).values(file).returning();
    return newFile;
  }
  
  // Chat session operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db.insert(chatSessions).values(session).returning();
    return newSession;
  }

  async getChatSessionById(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId));
    return session;
  }

  async getChatSessionsByUser(userId: number): Promise<ChatSession[]> {
    return db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }
  
  // Chat message operations
  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    
    // Update chat session's updatedAt timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, message.sessionId));
    
    return newMessage;
  }
  
  // Macro operations
  async getAllMacros(): Promise<Macro[]> {
    return db.select().from(macros).orderBy(asc(macros.title));
  }

  async getMacroById(id: number): Promise<Macro | undefined> {
    const [macro] = await db.select().from(macros).where(eq(macros.id, id));
    return macro;
  }

  async createMacro(macro: InsertMacro): Promise<Macro> {
    const [newMacro] = await db.insert(macros).values(macro).returning();
    return newMacro;
  }
  
  // Analytics operations
  async getTicketAnalytics(startDate: Date, endDate: Date): Promise<TicketAnalytics[]> {
    return db
      .select()
      .from(ticketAnalytics)
      .where(and(
        sql`${ticketAnalytics.date} >= ${startDate}`,
        sql`${ticketAnalytics.date} <= ${endDate}`
      ))
      .orderBy(asc(ticketAnalytics.date));
  }

  async createTicketAnalytics(analytics: InsertTicketAnalytics): Promise<TicketAnalytics> {
    const [newAnalytics] = await db.insert(ticketAnalytics).values(analytics).returning();
    return newAnalytics;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<{
    openTickets: number;
    pendingTickets: number;
    solvedTickets: number;
    totalArticles: number;
    unassignedTickets: number;
  }> {
    const openCount = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, 'open'));

    const pendingCount = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, 'pending'));

    const solvedCount = await db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, 'solved'));

    const articlesCount = await db
      .select({ count: count() })
      .from(articles)
      .where(eq(articles.isPublished, true));

    const unassignedCount = await db
      .select({ count: count() })
      .from(tickets)
      .where(and(
        not(eq(tickets.status, 'solved')),
        isNull(tickets.assigneeId)
      ));

    return {
      openTickets: openCount[0].count,
      pendingTickets: pendingCount[0].count,
      solvedTickets: solvedCount[0].count,
      totalArticles: articlesCount[0].count,
      unassignedTickets: unassignedCount[0].count,
    };
  }
}

export const storage = new DatabaseStorage();
