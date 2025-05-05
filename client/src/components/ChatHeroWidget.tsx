import { useState, useRef, useEffect } from "react";
import { SendIcon, Bot, MicIcon, PlusIcon, SearchIcon, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";
import { Avatar } from "@/components/ui/avatar";

export default function ChatHeroWidget() {
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(nanoid()).current;
  const [showChat, setShowChat] = useState(false);
  
  // Temporarily use local state until socket issue is fixed
  const [messages, setMessages] = useState<Array<{ content: string, isFromUser: boolean }>>([
    { content: "Hi there! I'm your Parkspass Assistant. How can I help you today with Utah State Parks?", isFromUser: false }
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
      setShowChat(true);
    }
  };

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col items-center">
      {/* Main Input Area */}
      <div className="w-full max-w-3xl mx-auto">
        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center bg-white rounded-full border border-gray-300 shadow-md dark:bg-gray-800 dark:border-gray-700"
        >
          <Button 
            type="button" 
            variant="ghost" 
            className="absolute left-2 text-gray-400 hover:text-gray-600"
            size="icon"
          >
            <PlusIcon className="w-5 h-5" />
          </Button>
          
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about Utah State Parks..."
            className="flex-1 py-6 px-12 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 dark:text-white placeholder-gray-500"
          />
          
          <div className="absolute right-2 flex space-x-1">
            <Button 
              type="button" 
              variant="ghost" 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              size="icon"
            >
              <SearchIcon className="w-5 h-5" />
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              size="icon"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              size="icon"
            >
              <MicIcon className="w-5 h-5" />
            </Button>
            
            <Button 
              type="submit" 
              variant="ghost" 
              className={cn(
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                inputMessage.trim() ? "text-primary-600 hover:text-primary-700" : ""
              )}
              size="icon"
              disabled={!inputMessage.trim()}
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>

      {/* Chat Messages - Shown only when there's a conversation */}
      {showChat && (
        <div 
          ref={chatContainerRef}
          className="w-full max-w-3xl mx-auto mt-6 bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-h-[400px] overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
        >
          {/* Message History */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "mb-6",
                message.isFromUser ? "flex justify-end" : "flex"
              )}
            >
              {!message.isFromUser && (
                <Avatar className="h-8 w-8 mr-4 bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5" />
                </Avatar>
              )}
              <div className={cn(
                "p-3 rounded-lg max-w-[80%]",
                message.isFromUser 
                  ? "bg-primary-600 text-white" 
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
              )}>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          {/* AI Typing Indicator */}
          {isTyping && (
            <div className="mb-6 flex">
              <Avatar className="h-8 w-8 mr-4 bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5" />
              </Avatar>
              <div className="bg-gray-100 p-3 rounded-lg dark:bg-gray-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}