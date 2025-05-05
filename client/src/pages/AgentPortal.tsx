import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AgentSidebar from "@/components/AgentSidebar";
import TicketTable from "@/components/TicketTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "@shared/schema";

export default function AgentPortal() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  // Fetch all tickets
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Filter tickets based on status and assignment
  const filteredTickets = tickets?.filter(ticket => {
    // Status filter
    if (filter !== "all" && ticket.status !== filter) {
      return false;
    }
    // Assignment filter
    if (assignmentFilter === "assigned" && !ticket.assigneeId) {
      return false;
    }
    if (assignmentFilter === "unassigned" && ticket.assigneeId) {
      return false;
    }
    if (assignmentFilter === "mine" && ticket.assigneeId !== 1) { // Assuming current agent ID is 1
      return false;
    }
    return true;
  });

  // Selected ticket (for mobile view)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Handle ticket click
  const handleTicketClick = (ticketId: number) => {
    navigate(`/admin/tickets/${ticketId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <AgentSidebar activePage="tickets" />

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Tickets</h1>
                <div className="flex space-x-3">
                  <Select
                    value={assignmentFilter}
                    onValueChange={setAssignmentFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="mine">Assigned to me</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter}
                    onValueChange={setFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="solved">Solved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tickets</p>
                  <p className="text-2xl font-semibold text-primary-600 dark:text-primary-500">{stats?.openTickets || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-500">{stats?.pendingTickets || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Solved</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-500">{stats?.solvedTickets || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unassigned</p>
                  <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{stats?.unassignedTickets || 0}</p>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="mt-8">
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="board">Board View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="w-full">
                    <TicketTable 
                      tickets={filteredTickets || []} 
                      isLoading={isLoading} 
                      onTicketClick={handleTicketClick}
                    />
                  </TabsContent>
                  <TabsContent value="board">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Board view would go here */}
                      <div className="p-4 border border-dashed rounded-lg h-96 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">Board view coming soon</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
