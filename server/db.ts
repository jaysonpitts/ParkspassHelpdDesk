import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Additional setup for pgvector (will be implemented once the DB is available)
// This is a placeholder for the pgvector extension setup
// We'll need to run: CREATE EXTENSION IF NOT EXISTS vector;
// And create indexes: CREATE INDEX ON article_embeddings USING ivfflat (embedding vector_l2_ops);
