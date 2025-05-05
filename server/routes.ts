import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthRequest, requireAuth, requireAgent } from "./auth";
import { setupSocketServer } from "./socket";
import express, { Request, Response } from "express";
import { z } from "zod";
import { 
  insertArticleSchema, insertCategorySchema, insertTicketSchema, 
  insertTicketMessageSchema, insertMacroSchema, insertTicketFileSchema 
} from "@shared/schema";
import { seedDatabase } from "./seed";
import { chatCompletion, streamChatResponse } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up Socket.io
  setupSocketServer(httpServer);
  
  // Seed the database if needed
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Error seeding database:", error);
  }
  
  // Set up API routes (prefix with /api)
  const apiRouter = express.Router();
  
  // Health check endpoint
  apiRouter.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
  
  // ===== User Routes =====
  apiRouter.get("/user", requireAuth, async (req: AuthRequest, res: Response) => {
    res.json(req.user);
  });
  
  // ===== Category Routes =====
  apiRouter.get("/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  apiRouter.get("/categories/:id", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategoryById(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
  
  apiRouter.post("/categories", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  apiRouter.patch("/categories/:id", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      
      const updatedCategory = await storage.updateCategory(categoryId, validatedData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  // ===== Article Routes =====
  apiRouter.get("/articles", async (req: Request, res: Response) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });
  
  apiRouter.get("/articles/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const articles = await storage.searchArticles(query);
      res.json(articles);
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });
  
  apiRouter.get("/articles/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const articles = await storage.getArticlesByCategory(categoryId);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      res.status(500).json({ message: "Failed to fetch articles by category" });
    }
  });
  
  apiRouter.get("/articles/:id", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Increment view count
      await storage.incrementArticleViews(articleId);
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });
  
  apiRouter.post("/articles", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertArticleSchema.parse({
        ...req.body,
        authorId: req.user?.id
      });
      
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });
  
  apiRouter.patch("/articles/:id", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const validatedData = insertArticleSchema.partial().parse(req.body);
      
      const updatedArticle = await storage.updateArticle(articleId, validatedData);
      
      if (!updatedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });
  
  // ===== Ticket Routes =====
  apiRouter.get("/tickets", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      let tickets;
      
      // If agent, can see all tickets
      if (req.isAgent) {
        // Filter by status if provided
        if (req.query.status) {
          tickets = await storage.getTicketsByStatus(req.query.status as 'open' | 'pending' | 'solved');
        } 
        // Filter by assignee if provided
        else if (req.query.assignee === 'me') {
          tickets = await storage.getTicketsByAssignee(req.user!.id);
        }
        // All tickets
        else {
          tickets = await storage.getAllTickets();
        }
      } 
      // If regular user, can only see their own tickets
      else {
        tickets = await storage.getTicketsByRequester(req.user!.id);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });
  
  apiRouter.get("/tickets/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permission: agents can access any ticket, users can only access their own
      if (!req.isAgent && ticket.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to access this ticket" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });
  
  apiRouter.post("/tickets", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertTicketSchema.parse({
        ...req.body,
        requesterId: req.user!.id
      });
      
      const ticket = await storage.createTicket(validatedData);
      
      // Create initial message from ticket description
      await storage.createTicketMessage({
        ticketId: ticket.id,
        authorId: req.user!.id,
        content: ticket.description
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });
  
  apiRouter.patch("/tickets/:id/status", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['open', 'pending', 'solved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'open', 'pending', or 'solved'" });
      }
      
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permission: only agents can change status
      if (!req.isAgent) {
        return res.status(403).json({ message: "Only agents can change ticket status" });
      }
      
      const updatedTicket = await storage.updateTicketStatus(ticketId, status as 'open' | 'pending' | 'solved');
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });
  
  apiRouter.patch("/tickets/:id/assign", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { assigneeId } = req.body;
      
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const updatedTicket = await storage.assignTicket(ticketId, assigneeId);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ message: "Failed to assign ticket" });
    }
  });
  
  // ===== Ticket Messages Routes =====
  apiRouter.get("/tickets/:id/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permission: agents can access any ticket, users can only access their own
      if (!req.isAgent && ticket.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to access this ticket" });
      }
      
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket messages" });
    }
  });
  
  apiRouter.post("/tickets/:id/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permission: agents can post to any ticket, users can only post to their own
      if (!req.isAgent && ticket.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to post to this ticket" });
      }
      
      const validatedData = insertTicketMessageSchema.parse({
        ticketId,
        authorId: req.user!.id,
        content: req.body.content,
        isFromAI: req.body.isFromAI || false
      });
      
      const message = await storage.createTicketMessage(validatedData);
      
      // If a visitor responds to a pending ticket, change status back to open
      if (!req.isAgent && ticket.status === 'pending') {
        await storage.updateTicketStatus(ticketId, 'open');
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating ticket message:", error);
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });
  
  // ===== Ticket Files Routes =====
  apiRouter.get("/tickets/:id/files", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permission: agents can access any ticket, users can only access their own
      if (!req.isAgent && ticket.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to access this ticket" });
      }
      
      const files = await storage.getTicketFiles(ticketId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching ticket files:", error);
      res.status(500).json({ message: "Failed to fetch ticket files" });
    }
  });
  
  apiRouter.post("/tickets/:id/files", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check permission: agents can post to any ticket, users can only post to their own
      if (!req.isAgent && ticket.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to post to this ticket" });
      }
      
      // Note: In a real app, you'd handle file uploads here
      // This is a simplified version focusing on the data structure
      const validatedData = insertTicketFileSchema.parse({
        ticketId,
        filename: req.body.filename,
        fileUrl: req.body.fileUrl,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType
      });
      
      const file = await storage.createTicketFile(validatedData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      console.error("Error creating ticket file:", error);
      res.status(500).json({ message: "Failed to create ticket file" });
    }
  });
  
  // ===== Macro Routes =====
  apiRouter.get("/macros", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const macros = await storage.getAllMacros();
      res.json(macros);
    } catch (error) {
      console.error("Error fetching macros:", error);
      res.status(500).json({ message: "Failed to fetch macros" });
    }
  });
  
  apiRouter.get("/macros/:id", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const macroId = parseInt(req.params.id);
      const macro = await storage.getMacroById(macroId);
      
      if (!macro) {
        return res.status(404).json({ message: "Macro not found" });
      }
      
      res.json(macro);
    } catch (error) {
      console.error("Error fetching macro:", error);
      res.status(500).json({ message: "Failed to fetch macro" });
    }
  });
  
  apiRouter.post("/macros", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = insertMacroSchema.parse({
        ...req.body,
        createdById: req.user!.id
      });
      
      const macro = await storage.createMacro(validatedData);
      res.status(201).json(macro);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid macro data", errors: error.errors });
      }
      console.error("Error creating macro:", error);
      res.status(500).json({ message: "Failed to create macro" });
    }
  });
  
  // ===== Dashboard Stats =====
  apiRouter.get("/dashboard/stats", requireAuth, requireAgent, async (req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  // ===== AI Assistant =====
  apiRouter.post("/assist", async (req: Request, res: Response) => {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    
    try {
      // For simple query/response (non-streaming)
      const sessionMessages: any[] = []; // In production, load previous messages
      const response = await chatCompletion(sessionMessages, query);
      
      res.json({ response });
    } catch (error) {
      console.error("Error with AI assistant:", error);
      res.status(500).json({ message: "Failed to get AI assistance" });
    }
  });
  
  // Streaming AI responses over Server-Sent Events
  apiRouter.get("/assist/stream", async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const sessionId = req.query.sessionId as string;
    
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    try {
      // Start streaming response
      const sessionMessages: any[] = []; // In production, load previous messages
      
      await streamChatResponse(
        sessionMessages,
        query,
        (chunk, done) => {
          if (done) {
            res.write(`data: [DONE]\n\n`);
            res.end();
          } else {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          }
        }
      );
    } catch (error) {
      console.error("Error streaming AI response:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to stream AI response" })}\n\n`);
      res.end();
    }
  });
  
  // Mount API router
  app.use("/api", apiRouter);
  
  return httpServer;
}
