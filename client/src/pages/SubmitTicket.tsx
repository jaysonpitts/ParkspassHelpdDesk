import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeftIcon, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTicketSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import TicketForm from "@/components/TicketForm";

// Extend the ticket schema with validation rules
const ticketFormSchema = insertTicketSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export default function SubmitTicket() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);

  // Set up react-hook-form
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "normal",
      firstName: "",
      lastName: "",
      email: "",
      orderNumber: "",
    },
  });

  // Create ticket mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      const ticket = {
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        orderNumber: data.orderNumber,
      };
      // In a real implementation, you'd handle file uploads here as well
      const response = await apiRequest("POST", "/api/tickets", ticket);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your ticket has been submitted. We'll respond as soon as possible.",
      });
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem submitting your ticket. Please try again.",
        variant: "destructive",
      });
      console.error("Submit ticket error:", error);
    },
  });

  // Handle form submission
  const onSubmit = (data: TicketFormValues) => {
    mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 flex items-center text-primary-600 hover:text-primary-700 p-0"
          onClick={() => navigate("/")}
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Back to Help Center
        </Button>

        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Submit a Support Request</h1>
          </CardHeader>

          <CardContent className="p-6">
            <TicketForm 
              form={form}
              onSubmit={onSubmit}
              isPending={isPending}
              files={files}
              setFiles={setFiles}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
