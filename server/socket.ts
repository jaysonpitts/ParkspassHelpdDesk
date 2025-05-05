import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { db } from './db';
import { ticketMessages, tickets, insertTicketMessageSchema, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { streamChatResponse } from './ai';

interface TicketMessage {
  ticketId: number;
  content: string;
  authorId?: number;
  isFromAI?: boolean;
}

export function setupSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*', // In production, this should be restricted
      methods: ['GET', 'POST']
    }
  });

  // Middleware to handle authentication
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Authentication error"));
    }
    // Attach user ID to socket
    (socket as any).userId = userId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    
    // Join a ticket room
    socket.on('join-ticket', (ticketId: number) => {
      const room = `ticket:${ticketId}`;
      socket.join(room);
      console.log(`Client ${socket.id} joined room ${room}`);
    });
    
    // Leave a ticket room
    socket.on('leave-ticket', (ticketId: number) => {
      const room = `ticket:${ticketId}`;
      socket.leave(room);
      console.log(`Client ${socket.id} left room ${room}`);
    });
    
    // Send a message in a ticket thread
    socket.on('ticket-message', async (message: TicketMessage) => {
      try {
        // Validate message
        const validatedMessage = insertTicketMessageSchema.parse({
          ticketId: message.ticketId,
          content: message.content,
          authorId: message.authorId || (socket as any).userId,
          isFromAI: message.isFromAI || false
        });
        
        // Save message to database
        const [savedMessage] = await db.insert(ticketMessages)
          .values(validatedMessage)
          .returning();
        
        // Update ticket's updatedAt timestamp
        await db.update(tickets)
          .set({ updatedAt: new Date() })
          .where(eq(tickets.id, message.ticketId));
        
        // Get author information
        let authorInfo = null;
        if (savedMessage.authorId) {
          const [author] = await db.select()
            .from(users)
            .where(eq(users.id, savedMessage.authorId));
          
          if (author) {
            authorInfo = {
              id: author.id,
              name: author.name,
              role: author.role
            };
          }
        }
        
        // Broadcast message to all clients in the ticket room
        const room = `ticket:${message.ticketId}`;
        io.to(room).emit('ticket-message', {
          ...savedMessage,
          author: authorInfo
        });
        
      } catch (error) {
        console.error('Error handling ticket message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // AI chat functionality
    socket.on('ai-message', async (data: { message: string, sessionId: string }) => {
      try {
        const userId = (socket as any).userId;
        const { message, sessionId } = data;
        
        // Store user message in database
        // This is simplified - in a real app, you'd want to store this more robustly
        
        // Send acknowledgment that message was received
        socket.emit('ai-message-received', { sessionId });
        
        // Create a unique room for this chat session
        const room = `chat:${sessionId}`;
        socket.join(room);
        
        // Start streaming AI response
        const sessionMessages: any[] = []; // In a real app, you'd load previous messages
        
        await streamChatResponse(
          sessionMessages,
          message,
          (chunk, done) => {
            // Send chunk to client
            socket.emit('ai-message-chunk', { 
              content: chunk, 
              done,
              sessionId 
            });
            
            // If done, leave the room
            if (done) {
              // In a real app, you'd store the complete AI response here
              socket.leave(room);
            }
          }
        );
        
      } catch (error) {
        console.error('Error processing AI message:', error);
        socket.emit('error', { message: 'Failed to process AI message' });
      }
    });
    
    // Handle status changes
    socket.on('update-ticket-status', async (data: { ticketId: number, status: 'open' | 'pending' | 'solved' }) => {
      try {
        const { ticketId, status } = data;
        
        // Update ticket status
        await db.update(tickets)
          .set({ 
            status,
            updatedAt: new Date()
          })
          .where(eq(tickets.id, ticketId));
        
        // Notify clients in the ticket room
        const room = `ticket:${ticketId}`;
        io.to(room).emit('ticket-updated', { ticketId, status });
        
      } catch (error) {
        console.error('Error updating ticket status:', error);
        socket.emit('error', { message: 'Failed to update ticket status' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
