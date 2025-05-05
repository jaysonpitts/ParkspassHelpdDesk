import { useState, useRef, useEffect } from "react";
import { MessageSquareIcon, XIcon, SendIcon, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true);
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
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
    <div className="fixed bottom-6 right-6 z-40">
      {/* Chat Button */}
      <Button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full shadow-lg"
        aria-label="Chat with Parkspass Assistant"
      >
        <MessageSquareIcon className="h-6 w-6" />
      </Button>

      {/* Chat Panel */}
      <Card
        className={cn(
          "absolute bottom-16 right-0 w-96 md:w-[450px] h-[600px] overflow-hidden transition-all duration-300 transform flex flex-col",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Chat Header */}
        <div className="bg-primary-600 px-4 py-3 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Parkspass Assistant</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-gray-200 h-8 w-8"
              onClick={toggleChat}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-primary-100">Ask me about Utah State Parks</p>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900"
        >
          {/* Conversation Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex mb-4",
                message.isFromUser ? "justify-end" : ""
              )}
            >
              {!message.isFromUser && (
                <Avatar className="h-8 w-8 mr-3 bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </Avatar>
              )}
              <div
                className={cn(
                  "p-3 rounded-lg shadow-sm max-w-[85%]",
                  message.isFromUser
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* AI Typing Indicator */}
          {isTyping && (
            <div className="flex mb-4">
              <Avatar className="h-8 w-8 mr-3 bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </Avatar>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm max-w-[85%]">
                <div className="flex space-x-2 h-5 items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white dark:bg-gray-800 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your question..."
              className="flex-grow rounded-r-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              className="rounded-l-none px-4"
              disabled={!inputMessage.trim()}
            >
              <SendIcon className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
