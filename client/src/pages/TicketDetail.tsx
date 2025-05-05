import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AgentSidebar from "@/components/AgentSidebar";
import TicketConversation from "@/components/TicketConversation";
import { apiRequest } from "@/lib/queryClient";
// import { useTicketRoom } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { Ticket, TicketMessage, User } from "@shared/schema";

export default function TicketDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const ticketId = parseInt(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Temporarily removed socket connection
  // Mock function until socket issue is fixed
  const updateStatus = (status: 'open' | 'pending' | 'solved') => {
    console.log(`Status update to ${status} would be sent via socket`);
  };
  
  // Manage message input
  const [messageInput, setMessageInput] = useState("");
  
  // AI assistant
  const { getAIAssistance, isLoadingAI } = useAIAssistant();

  // Fetch ticket data
  const { data: ticket, isLoading: isTicketLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${ticketId}`],
    enabled: !isNaN(ticketId),
  });

  // Fetch ticket messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery<TicketMessage[]>({
    queryKey: [`/api/tickets/${ticketId}/messages`],
    enabled: !isNaN(ticketId),
  });

  // Fetch requester info
  const { data: requester, isLoading: isRequesterLoading } = useQuery<User>({
    queryKey: [`/api/user/${ticket?.requesterId}`],
    enabled: !!ticket?.requesterId,
  });

  // Fetch assignee info
  const { data: assignee, isLoading: isAssigneeLoading } = useQuery<User>({
    queryKey: [`/api/user/${ticket?.assigneeId}`],
    enabled: !!ticket?.assigneeId,
  });

  // Fetch all agents for assignment dropdown
  const { data: agents } = useQuery<User[]>({
    queryKey: ['/api/users/agents'],
  });

  // Fetch macros
  const { data: macros } = useQuery({
    queryKey: ['/api/macros'],
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (status: 'open' | 'pending' | 'solved') => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      toast({
        title: "Status updated",
        description: "The ticket status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      });
      console.error("Status update error:", error);
    },
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (assigneeId: number) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/assign`, { assigneeId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      toast({
        title: "Ticket assigned",
        description: "The ticket has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign ticket.",
        variant: "destructive",
      });
      console.error("Assignment error:", error);
    },
  });

  // Message mutation
  const messageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/messages`] });
      setMessageInput("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
      console.error("Message error:", error);
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatus(status as 'open' | 'pending' | 'solved');
    statusMutation.mutate(status as 'open' | 'pending' | 'solved');
  };

  // Handle assignment change
  const handleAssignmentChange = (assigneeId: string) => {
    assignMutation.mutate(parseInt(assigneeId));
  };

  // Handle message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      messageMutation.mutate(messageInput);
    }
  };

  // Handle macro selection
  const handleMacroSelect = (macroId: string) => {
    const macro = macros?.find(m => m.id === parseInt(macroId));
    if (macro) {
      setMessageInput(macro.content);
    }
  };

  // Handle AI assistance
  const handleGetAIHelp = async () => {
    if (!ticket) return;
    
    const userQuery = ticket.description;
    const assistanceResponse = await getAIAssistance(userQuery);
    
    if (assistanceResponse) {
      // Insert AI response as a message
      messageMutation.mutate(`[AI Assistance] ${assistanceResponse}`);
    }
  };

  // Determine if all necessary data is loading
  const isLoading = isTicketLoading || isMessagesLoading || isRequesterLoading || isAssigneeLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar activePage="tickets" />
        <div className="flex-1 overflow-auto p-8">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AgentSidebar activePage="tickets" />
        <div className="flex-1 overflow-auto p-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
            <p className="mb-6">The ticket you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/admin")}>Return to Dashboard</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AgentSidebar activePage="tickets" />
      
      <div className="flex-1 overflow-auto">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="mb-6 flex items-center text-primary-600 hover:text-primary-700 p-0 dark:text-primary-500 dark:hover:text-primary-400"
            onClick={() => navigate("/admin")}
          >
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main conversation */}
            <div className="flex-1">
              <Card className="mb-6">
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold">#{ticket.id}: {ticket.subject}</h1>
                    <div className="flex items-center space-x-2">
                      <Select 
                        value={ticket.status} 
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="solved">Solved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {messages && (
                    <TicketConversation 
                      messages={messages} 
                      requester={requester}
                    />
                  )}
                  
                  {/* Message input */}
                  <form onSubmit={handleSendMessage} className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Select onValueChange={handleMacroSelect}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Apply Macro" />
                        </SelectTrigger>
                        <SelectContent>
                          {macros?.map(macro => (
                            <SelectItem key={macro.id} value={macro.id.toString()}>
                              {macro.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleGetAIHelp}
                        disabled={isLoadingAI}
                      >
                        {isLoadingAI ? "Getting AI Help..." : "Get AI Help"}
                      </Button>
                    </div>
                    
                    <div className="flex">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={4}
                        placeholder="Type your reply..."
                      />
                      <Button 
                        type="submit"
                        className="rounded-l-none"
                        disabled={!messageInput.trim() || messageMutation.isPending}
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with ticket details */}
            <div className="w-full lg:w-72">
              <Card>
                <CardHeader className="pb-3 border-b">
                  <h2 className="font-medium">Ticket Details</h2>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Requester</h3>
                      <p className="mt-1">{requester?.name || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{requester?.email || "No email"}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Number</h3>
                      <p className="mt-1">{ticket.orderNumber || "N/A"}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</h3>
                      <p className="mt-1 capitalize">{ticket.priority}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</h3>
                      <Select 
                        value={ticket.assigneeId?.toString() || "unassigned"} 
                        onValueChange={handleAssignmentChange}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {agents?.map(agent => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                      <p className="mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
                      <p className="mt-1">
                        {new Date(ticket.updatedAt).toLocaleDateString()} {new Date(ticket.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
