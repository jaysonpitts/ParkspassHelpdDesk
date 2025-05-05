import OpenAI from "openai";
import { db } from "./db";
import { articles, articleEmbeddings } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";
const EMBEDDING_MODEL = "text-embedding-3-small";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// System prompt for the Parkspass Assistant
const SYSTEM_PROMPT = `You are the Parkspass Assistant, a helpful AI trained to assist visitors with questions about Utah State Parks and the Parkspass service.
Your goal is to provide clear, accurate information about park reservations, amenities, policies, and features.
If you don't know the answer, acknowledge that and suggest the visitor submit a support ticket for more personalized assistance.
You should be friendly, concise, and informative in your responses.
Base your answers on the knowledge base articles provided in the context.`;

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

// Store article embedding in database
export async function storeArticleEmbedding(articleId: number, content: string): Promise<void> {
  try {
    const embedding = await generateEmbedding(content);
    
    // Convert embedding to string for storage
    const embeddingString = JSON.stringify(embedding);
    
    // Check if an embedding already exists for this article
    const existingEmbeddings = await db.select()
      .from(articleEmbeddings)
      .where(eq(articleEmbeddings.articleId, articleId));
    
    if (existingEmbeddings.length > 0) {
      // Update existing embedding
      await db.update(articleEmbeddings)
        .set({ embedding: embeddingString })
        .where(eq(articleEmbeddings.id, existingEmbeddings[0].id));
    } else {
      // Insert new embedding
      await db.insert(articleEmbeddings)
        .values({
          articleId,
          embedding: embeddingString,
        });
    }
  } catch (error) {
    console.error("Error storing article embedding:", error);
    throw new Error("Failed to store article embedding");
  }
}

// Find relevant articles based on similarity search
export async function findRelevantArticles(query: string, limit = 3): Promise<any[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const queryEmbeddingJson = JSON.stringify(queryEmbedding);

    // Note: This is a simplified version. In production with pgvector,
    // we would use vector similarity search directly in the database.
    // For now, we'll load embeddings and compare manually.
    const allEmbeddings = await db.select()
      .from(articleEmbeddings)
      .innerJoin(articles, eq(articleEmbeddings.articleId, articles.id))
      .where(eq(articles.isPublished, true));
    
    // Calculate similarities
    const withSimilarity = allEmbeddings.map(item => {
      const storedEmbedding = JSON.parse(item.article_embeddings.embedding);
      const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
      return {
        ...item,
        similarity
      };
    });
    
    // Sort by similarity (descending) and take top results
    return withSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error("Error finding relevant articles:", error);
    throw new Error("Failed to find relevant articles");
  }
}

// Chat completion with context from relevant articles
export async function chatCompletion(
  sessionMessages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
  query: string
): Promise<string> {
  try {
    // Find relevant articles
    const relevantArticles = await findRelevantArticles(query);
    
    // Build context from relevant articles
    const context = relevantArticles.map(article => 
      `Article: ${article.articles.title}\n${article.articles.content}`
    ).join('\n\n');
    
    // Create message array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...sessionMessages,
      { role: 'user', content: query }
    ];
    
    // If we have relevant context, add it to the system message
    if (context) {
      messages.unshift({
        role: 'system',
        content: `Here are some relevant knowledge base articles that may help with the query:\n\n${context}`
      });
    }

    // Generate completion
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages as any, // Type casting to satisfy TypeScript
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error in chat completion:", error);
    return "I apologize, but I'm having trouble processing your request. Please try again later or submit a support ticket for assistance.";
  }
}

// Helper function: Cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Stream chat response (for real-time responses)
export async function streamChatResponse(
  sessionMessages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
  query: string,
  callback: (chunk: string, done: boolean) => void
): Promise<void> {
  try {
    // Find relevant articles
    const relevantArticles = await findRelevantArticles(query);
    
    // Build context from relevant articles
    const context = relevantArticles.map(article => 
      `Article: ${article.articles.title}\n${article.articles.content}`
    ).join('\n\n');
    
    // Create message array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...sessionMessages,
      { role: 'user', content: query }
    ];
    
    // If we have relevant context, add it to the system message
    if (context) {
      messages.unshift({
        role: 'system',
        content: `Here are some relevant knowledge base articles that may help with the query:\n\n${context}`
      });
    }

    // Stream completion
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages as any, // Type casting to satisfy TypeScript
      temperature: 0.7,
      stream: true,
    });

    let responseText = '';
    
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        responseText += chunk.choices[0].delta.content;
        callback(chunk.choices[0].delta.content, false);
      }
    }
    
    callback("", true); // Signal that streaming is complete
    return;
  } catch (error) {
    console.error("Error in streaming chat response:", error);
    callback("I apologize, but I'm having trouble processing your request. Please try again later or submit a support ticket for assistance.", true);
  }
}
