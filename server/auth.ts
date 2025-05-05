import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, User } from '@shared/schema';
import { eq } from 'drizzle-orm';

// The Clerk webhook verification would normally go here
// This is a simplified version focusing on the core functionality

// Interface for authenticated request
export interface AuthRequest extends Request {
  user?: User;
  isAgent?: boolean;
}

// Middleware to check if user is authenticated
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // For development, you can use a custom header to simulate auth
    // In production, this would be handled by Clerk's middleware
    const clerkId = req.headers['x-clerk-user-id'] as string;
    
    if (!clerkId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Find user in database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.clerkId, clerkId));
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    req.isAgent = user.role === 'agent';
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Middleware to check if user is an agent
export function requireAgent(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.isAgent) {
    return res.status(403).json({ message: 'Access denied. Agent role required.' });
  }
  
  next();
}

// Helper function to check if a user is authorized to access a specific ticket
export async function canAccessTicket(userId: number, ticketId: number): Promise<boolean> {
  try {
    // Get the user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return false;
    
    // If user is an agent, they can access any ticket
    if (user.role === 'agent') return true;
    
    // If user is a visitor, they can only access their own tickets
    const [ticket] = await db.select()
      .from(tickets)
      .where(eq(tickets.id, ticketId));
    
    return ticket?.requesterId === userId;
  } catch (error) {
    console.error('Error checking ticket access:', error);
    return false;
  }
}

// Import tickets table for canAccessTicket function
import { tickets } from '@shared/schema';
