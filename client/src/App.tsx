import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SubmitTicket from "@/pages/SubmitTicket";
import AgentPortal from "@/pages/AgentPortal";
import ArticleView from "@/pages/ArticleView";
import ArticleCategory from "@/pages/ArticleCategory";
import TicketDetail from "@/pages/TicketDetail";
import KnowledgeBaseEditor from "@/pages/KnowledgeBaseEditor";
import AnalyticsPage from "@/pages/AnalyticsPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
// import { SocketProvider } from "@/lib/socket";

function Router() {
  const [location] = useLocation();
  const isAgentPortal = location.includes('/admin');
  const isChatPage = location === '/chat';

  if (isChatPage) {
    return <ChatWidget />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isAgentPortal && <Header />}
      
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/submit-ticket" component={SubmitTicket} />
          <Route path="/article/:id" component={ArticleView} />
          <Route path="/category/:id" component={ArticleCategory} />
          
          {/* Agent Portal Routes */}
          <Route path="/admin" component={AgentPortal} />
          <Route path="/admin/tickets/:id" component={TicketDetail} />
          <Route path="/admin/kb/editor/:id?" component={KnowledgeBaseEditor} />
          <Route path="/admin/analytics" component={AnalyticsPage} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isAgentPortal && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="parkspass-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
