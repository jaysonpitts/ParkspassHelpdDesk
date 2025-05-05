import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  InboxIcon, 
  BookOpenIcon, 
  BarChartIcon, 
  SettingsIcon,
  UserIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AgentSidebarProps {
  activePage: "tickets" | "knowledge" | "analytics" | "settings";
}

export default function AgentSidebar({ activePage }: AgentSidebarProps) {
  const [, navigate] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      icon: <InboxIcon className="h-5 w-5 mr-3" />,
      label: "Tickets",
      href: "/admin",
      active: activePage === "tickets",
    },
    {
      icon: <BookOpenIcon className="h-5 w-5 mr-3" />,
      label: "Knowledge Base",
      href: "/admin/kb/editor",
      active: activePage === "knowledge",
    },
    {
      icon: <BarChartIcon className="h-5 w-5 mr-3" />,
      label: "Analytics",
      href: "/admin/analytics",
      active: activePage === "analytics",
    },
    {
      icon: <SettingsIcon className="h-5 w-5 mr-3" />,
      label: "Settings",
      href: "/admin/settings",
      active: activePage === "settings",
    },
  ];

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <>
      <div className="flex items-center h-16 px-4 bg-gray-900 dark:bg-gray-800">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 9.5L12 4L19.5 9.5V20H4.5V9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M9 20V14C9 13.4477 9.44772 13 10 13H14C14.5523 13 15 13.4477 15 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span className="ml-2 text-white text-xl font-medium">Agent Portal</span>
        </div>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  item.active
                    ? "bg-gray-900 text-white dark:bg-gray-700"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
                onClick={closeMobileMenu}
              >
                {item.icon}
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-700 dark:border-gray-600 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                <UserIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Park Agent</p>
              <p className="text-xs font-medium text-gray-300 group-hover:text-gray-200">
                View profile
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gray-800 dark:bg-gray-900">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Header with Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-gray-800 dark:bg-gray-900 shadow-md">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 9.5L12 4L19.5 9.5V20H4.5V9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M9 20V14C9 13.4477 9.44772 13 10 13H14C14.5523 13 15 13.4477 15 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span className="ml-2 text-white text-xl font-medium">Agent Portal</span>
          </div>

          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-gray-800 text-white">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Top padding for mobile to prevent content from hiding under header */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
