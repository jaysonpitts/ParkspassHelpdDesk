import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Ticket, TicketMessage } from "@shared/schema";

export function useTickets() {
  const queryClient = useQueryClient();

  // Get all tickets
  const getAllTickets = () => {
    return useQuery<Ticket[]>({
      queryKey: ['/api/tickets'],
    });
  };

  // Get a specific ticket
  const getTicket = (ticketId: number) => {
    return useQuery<Ticket>({
      queryKey: [`/api/tickets/${ticketId}`],
      enabled: !!ticketId,
    });
  };

  // Get ticket messages
  const getTicketMessages = (ticketId: number) => {
    return useQuery<TicketMessage[]>({
      queryKey: [`/api/tickets/${ticketId}/messages`],
      enabled: !!ticketId,
    });
  };

  // Get tickets by status
  const getTicketsByStatus = (status: string) => {
    return useQuery<Ticket[]>({
      queryKey: [`/api/tickets?status=${status}`],
    });
  };

  // Create a new ticket
  const createTicket = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await apiRequest("POST", "/api/tickets", ticketData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
  });

  // Update ticket status
  const updateTicketStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${variables.ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
  });

  // Assign ticket to agent
  const assignTicket = useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: number; assigneeId: number }) => {
      const response = await apiRequest("PATCH", `/api/tickets/${ticketId}/assign`, { assigneeId });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${variables.ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
  });

  // Add message to ticket
  const addTicketMessage = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/messages`, { content });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${variables.ticketId}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${variables.ticketId}`] });
    },
  });

  return {
    getAllTickets,
    getTicket,
    getTicketMessages,
    getTicketsByStatus,
    createTicket,
    updateTicketStatus,
    assignTicket,
    addTicketMessage,
  };
}
