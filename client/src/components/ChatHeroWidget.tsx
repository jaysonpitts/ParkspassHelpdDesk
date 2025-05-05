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
          className="relative flex items-center bg-white/90 backdrop-blur-sm rounded-full border border-white/30 shadow-xl dark:bg-gray-800/90 dark:border-gray-700/30"
        >
          <Button 
            type="button" 
            variant="ghost" 
            className="absolute left-3 text-gray-400 hover:text-gray-600"
            size="icon"
          >
            <PlusIcon className="w-5 h-5" />
          </Button>
          
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about Utah State Parks..."
            className="flex-1 py-7 px-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 dark:text-white placeholder-gray-500 text-base"
          />
          
          <div className="absolute right-3 flex space-x-2">
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
              variant={inputMessage.trim() ? "default" : "ghost"}
              className={cn(
                "rounded-full w-10 h-10 flex items-center justify-center",
                !inputMessage.trim() && "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
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
          className="w-full max-w-4xl mx-auto mt-8 bg-white/90 rounded-xl shadow-xl border border-white/20 p-6 max-h-[500px] overflow-y-auto dark:bg-gray-800/90 dark:border-gray-700/20 backdrop-blur-sm"
        >
          {/* Message History */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "mb-8 last:mb-4",
                message.isFromUser ? "flex justify-end" : "flex items-start"
              )}
            >
              {!message.isFromUser && (
                <Avatar className="h-10 w-10 mr-4 bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 rounded-xl shadow-sm border border-violet-200">
                  <Bot className="h-5 w-5" />
                </Avatar>
              )}
              <div className={cn(
                "p-4 rounded-xl shadow-sm max-w-[85%]",
                message.isFromUser 
                  ? "bg-violet-600 text-white" 
                  : "bg-white text-gray-800 border border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              )}>
                <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
              </div>
              {message.isFromUser && (
                <Avatar className="h-10 w-10 ml-4 bg-violet-600 text-white flex items-center justify-center flex-shrink-0 rounded-xl shadow-sm">
                  <span className="text-sm font-semibold">You</span>
                </Avatar>
              )}
            </div>
          ))}

          {/* AI Typing Indicator */}
          {isTyping && (
            <div className="mb-8 flex items-start">
              <Avatar className="h-10 w-10 mr-4 bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 rounded-xl shadow-sm border border-violet-200">
                <Bot className="h-5 w-5" />
              </Avatar>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex space-x-2 h-6 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}