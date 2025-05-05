import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import { Ticket } from "@shared/schema";

interface TicketTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  onTicketClick: (ticketId: number) => void;
}

export default function TicketTable({ tickets, isLoading, onTicketClick }: TicketTableProps) {
  // Function to get appropriate badge style based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
            Open
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800">
            Pending
          </Badge>
        );
      case "solved":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
            Solved
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Function to get appropriate priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800">
            High
          </Badge>
        );
      case "normal":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
            Normal
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
            Low
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {priority}
          </Badge>
        );
    }
  };

  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  // Get relative time string
  const getTimeAgo = (date: string | Date) => {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tickets found</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          There are currently no tickets matching your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow 
                key={ticket.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => onTicketClick(ticket.id)}
              >
                <TableCell className="font-medium text-primary-600 dark:text-primary-500">
                  #{ticket.id} - {ticket.subject}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900 dark:text-gray-100">Sarah Johnson</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">sarah.j@example.com</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>
                <TableCell>
                  {getPriorityBadge(ticket.priority)}
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                  {ticket.assigneeId ? (
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-gray-200 text-gray-500 text-xs">
                          TP
                        </AvatarFallback>
                      </Avatar>
                      <span>Taylor Parks</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                  {getTimeAgo(ticket.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
