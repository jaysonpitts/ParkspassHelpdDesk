import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useLocation } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Time period options
const timePeriods = [
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "90days", label: "Last 90 days" },
];

export default function AnalyticsPage() {
  const [, navigate] = useLocation();
  const [timePeriod, setTimePeriod] = useState("30days");

  // Fetch ticket analytics data
  const { data: ticketData, isLoading: isTicketDataLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch ticket volume data
  const { data: volumeData, isLoading: isVolumeDataLoading } = useQuery({
    queryKey: [`/api/analytics/ticket-volume?period=${timePeriod}`],
  });

  // Fetch resolution time data
  const { data: resolutionData, isLoading: isResolutionDataLoading } = useQuery({
    queryKey: [`/api/analytics/resolution-time?period=${timePeriod}`],
  });

  // Sample data for charts (would be replaced with real data from the APIs)
  const sampleVolumeData = [
    { name: "Mon", value: 12 },
    { name: "Tue", value: 19 },
    { name: "Wed", value: 15 },
    { name: "Thu", value: 22 },
    { name: "Fri", value: 18 },
    { name: "Sat", value: 10 },
    { name: "Sun", value: 8 },
  ];

  const sampleStatusData = [
    { name: "Open", value: ticketData?.openTickets || 12 },
    { name: "Pending", value: ticketData?.pendingTickets || 8 },
    { name: "Solved", value: ticketData?.solvedTickets || 24 },
  ];

  const sampleCategoryData = [
    { name: "Reservations", value: 15 },
    { name: "Camping", value: 10 },
    { name: "Billing", value: 8 },
    { name: "Technical", value: 6 },
    { name: "Park Info", value: 11 },
  ];

  // Colors for charts
  const COLORS = ["#3182CE", "#805AD5", "#38B2AC", "#ED8936", "#E53E3E"];

  // Format value with K suffix for thousands
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  // Loading state
  const isLoading = isTicketDataLoading || isVolumeDataLoading || isResolutionDataLoading;

  return (
    <div className="flex h-screen overflow-hidden">
      <AgentSidebar activePage="analytics" />
      
      <div className="flex-1 overflow-auto">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="mr-4 flex items-center text-primary-600 hover:text-primary-700 p-0 dark:text-primary-500 dark:hover:text-primary-400"
                onClick={() => navigate("/admin")}
              >
                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold">Analytics</h1>
            </div>
            
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {timePeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-500">
                  {ticketData?.openTickets + ticketData?.pendingTickets + ticketData?.solvedTickets || 44}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Tickets
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                  {formatValue(ticketData?.totalArticles || 32)}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Knowledge Base Articles
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                  85%
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Resolution Rate
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-500">
                  4.2h
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg. Response Time
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Volume Chart */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-medium">Ticket Volume</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sampleVolumeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Tickets" fill="#3182CE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-medium">Ticket Status Distribution</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sampleStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sampleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-medium">Tickets by Category</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={sampleCategoryData}
                      margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Tickets" fill="#805AD5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Chart */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-medium">Average Resolution Time (hours)</h2>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Critical", value: 1.2 },
                        { name: "High", value: 3.5 },
                        { name: "Normal", value: 8.7 },
                        { name: "Low", value: 24.3 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Hours" fill="#38B2AC" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
