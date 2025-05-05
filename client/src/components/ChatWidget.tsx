import { useState, useRef, useEffect } from "react";
import { SendIcon, Bot, MicIcon, PlusIcon, SearchIcon, ImageIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";
import { Avatar } from "@/components/ui/avatar";

export default function ChatWidget() {
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(nanoid()).current;
  
  // Temporarily use local state until socket issue is fixed
  const [messages, setMessages] = useState<Array<{ content: string, isFromUser: boolean }>>([
    { content: "Hi there! I'm your Parkspass Assistant. How can I help you today?", isFromUser: false }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const sendMessage = async (message: string) => {
    // Add user message to messages
    setMessages(prev => [...prev, { content: message, isFromUser: true }]);
    
    // Simulate AI typing indicator
    setIsTyping(true);
    
    try {
      // Call assist API
      const response = await apiRequest("POST", "/api/assist", { query: message });
      const data = await response.json();
      
      // Add AI response
      if (data.response) {
        setMessages(prev => [...prev, { content: data.response, isFromUser: false }]);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      setMessages(prev => [...prev, { 
        content: "Sorry, I'm having trouble connecting right now. Please try again later.", 
        isFromUser: false 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Welcome Header */}
      <div className="py-8 text-center">
        <h1 className="text-3xl font-semibold mb-2">What would you like to know about Parkspass?</h1>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 lg:px-8 pb-4"
      >
        {/* Message History */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "mb-6 max-w-3xl mx-auto",
              message.isFromUser ? "flex justify-end" : "flex"
            )}
          >
            {!message.isFromUser && (
              <Avatar className="h-8 w-8 mr-4 bg-green-600 text-white flex items-center justify-center flex-shrink-0 rounded-full">
                <Bot className="h-5 w-5" />
              </Avatar>
            )}
            <div className="flex-1 text-base">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="mb-6 max-w-3xl mx-auto flex">
            <Avatar className="h-8 w-8 mr-4 bg-green-600 text-white flex items-center justify-center flex-shrink-0 rounded-full">
              <Bot className="h-5 w-5" />
            </Avatar>
            <div className="flex-1">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="relative flex items-center bg-gray-800 rounded-xl border border-gray-700 shadow-lg"
          >
            <Button 
              type="button" 
              variant="ghost" 
              className="absolute left-2 text-gray-400 hover:text-gray-300"
              size="icon"
            >
              <PlusIcon className="w-5 h-5" />
            </Button>
            
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 py-6 px-12 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder-gray-400"
            />
            
            <div className="absolute right-2 flex space-x-1">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-gray-400 hover:text-gray-300"
                size="icon"
              >
                <SearchIcon className="w-5 h-5" />
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="text-gray-400 hover:text-gray-300"
                size="icon"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="text-gray-400 hover:text-gray-300"
                size="icon"
              >
                <MicIcon className="w-5 h-5" />
              </Button>
              
              <Button 
                type="submit" 
                variant="ghost" 
                className={cn(
                  "text-gray-400 hover:text-gray-300",
                  inputMessage.trim() ? "text-white hover:text-white" : ""
                )}
                size="icon"
                disabled={!inputMessage.trim()}
              >
                <SendIcon className="w-5 h-5" />
              </Button>
            </div>
          </form>
          
          <div className="text-xs text-gray-500 text-center mt-2">
            Parkspass Assistant can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  );
}
