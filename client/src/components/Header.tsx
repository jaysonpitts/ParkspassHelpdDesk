import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import SearchBar from "@/components/SearchBar";
import { MoonIcon, SunIcon, MenuIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export default function Header() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    { label: "Help Center", href: "/" },
    { label: "Submit a Request", href: "/submit-ticket" },
    { label: "Agent Portal", href: "/admin" },
  ];

  return (
    <header className="bg-[#332a2a] border-b border-[#413636] sticky top-0 z-30 dark:bg-[#332a2a] dark:border-[#413636]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <svg className="h-8 w-8 text-[#e7a5b3] dark:text-[#e7a5b3]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 9.5L12 4L19.5 9.5V20H4.5V9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M9 20V14C9 13.4477 9.44772 13 10 13H14C14.5523 13 15 13.4477 15 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M12 4L2 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M12 4L22 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span className="ml-2 text-lg font-semibold text-white dark:text-white">Parkspass</span>
            <span className="ml-2 text-sm text-gray-300 dark:text-gray-300">Help Center</span>
          </Link>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <SearchBar />
        </div>

        {/* Navigation Links (Desktop) */}
        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-[#413636] dark:text-white dark:hover:bg-[#413636]">
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </Button>
          
          <div className="ml-2">
            <Button variant="default" size="sm" onClick={() => setLocation("/admin")}>
              Sign in
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full py-6">
                <div className="flex flex-col space-y-4 mt-4">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <a 
                        className="px-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md dark:text-gray-100 dark:hover:bg-gray-800"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search (Hidden on desktop) */}
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}
