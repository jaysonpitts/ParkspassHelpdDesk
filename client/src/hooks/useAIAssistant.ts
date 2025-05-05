import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface UseAIAssistantReturn {
  getAIAssistance: (query: string) => Promise<string | null>;
  isLoadingAI: boolean;
  aiError: Error | null;
}

export function useAIAssistant(): UseAIAssistantReturn {
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAIError] = useState<Error | null>(null);

  const getAIAssistance = async (query: string): Promise<string | null> => {
    try {
      setIsLoadingAI(true);
      setAIError(null);

      const response = await apiRequest("POST", "/api/assist", { query });
      const data = await response.json();

      return data.response;
    } catch (error) {
      console.error("AI assistance error:", error);
      setAIError(error as Error);
      return null;
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Function to stream AI response (for real-time responses)
  const streamAIAssistance = (query: string, onChunk: (chunk: string, done: boolean) => void) => {
    const eventSource = new EventSource(`/api/assist/stream?q=${encodeURIComponent(query)}`);
    
    setIsLoadingAI(true);
    setAIError(null);

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
        setIsLoadingAI(false);
        onChunk("", true);
      } else {
        try {
          const data = JSON.parse(event.data);
          onChunk(data.text, false);
        } catch (error) {
          console.error("Error parsing streaming response:", error);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setAIError(new Error("Failed to stream AI response"));
      eventSource.close();
      setIsLoadingAI(false);
      onChunk("", true);
    };

    // Return clean-up function
    return () => {
      eventSource.close();
      setIsLoadingAI(false);
    };
  };

  return {
    getAIAssistance,
    isLoadingAI,
    aiError,
  };
}
