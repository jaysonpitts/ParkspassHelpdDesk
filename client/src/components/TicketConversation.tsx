import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserIcon, Bot } from "lucide-react";
import { TicketMessage, User } from "@shared/schema";
import ReactMarkdown from "react-markdown";

interface TicketConversationProps {
  messages: TicketMessage[];
  requester?: User;
}

export default function TicketConversation({ messages, requester }: TicketConversationProps) {
  // Helper to determine if a message is from the requester
  const isRequesterMessage = (message: TicketMessage) => {
    return message.authorId === requester?.id;
  };
  
  // Helper to determine if a message is from AI
  const isAIMessage = (message: TicketMessage) => {
    return message.isFromAI;
  };
  
  // Format date for messages
  const formatMessageDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };
  
  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No messages in this ticket yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div key={message.id} className="flex">
          <Avatar className="h-10 w-10 mr-4 flex-shrink-0">
            <AvatarFallback className={
              isAIMessage(message) 
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300" 
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }>
              {isAIMessage(message) ? (
                <Bot className="h-5 w-5" />
              ) : (
                isRequesterMessage(message) ? getInitials(requester?.name || "Visitor") : <UserIcon className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {isAIMessage(message) 
                  ? "AI Assistant" 
                  : isRequesterMessage(message) 
                    ? requester?.name || "Visitor" 
                    : "Support Agent"}
              </h3>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatMessageDate(message.createdAt)}
              </span>
            </div>
            
            <div className="mt-1 text-gray-700 dark:text-gray-300 prose-sm prose dark:prose-invert max-w-none">
              {message.content.startsWith("[AI Assistance]") ? (
                <>
                  <div className="font-semibold text-primary-600 dark:text-primary-400 mb-1">
                    AI Assistance
                  </div>
                  <ReactMarkdown>
                    {message.content.replace("[AI Assistance] ", "")}
                  </ReactMarkdown>
                </>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
