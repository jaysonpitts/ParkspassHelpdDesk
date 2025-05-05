import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useDebounce } from "@/hooks/use-debounce";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  id: number;
  title: string;
  content: string;
  categoryId: number;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  const debouncedQuery = useDebounce(searchQuery, 300);

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/articles/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update search results when debounced query changes
  useEffect(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery, handleSearch]);

  // Handle keyboard shortcut to open search dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Mobile search input handler
  const handleMobileSearchFocus = () => {
    setIsOpen(true);
  };

  // Handle selecting a search result
  const handleSelectResult = (result: SearchResult) => {
    navigate(`/article/${result.id}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Extract excerpt from content
  const getExcerpt = (content: string, query: string) => {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    
    if (index === -1) return content.substring(0, 60) + "...";
    
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + query.length + 30);
    return (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "");
  };

  return (
    <>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          className="pl-10 pr-3 py-2 w-full"
          placeholder="Search for help..."
          onClick={handleMobileSearchFocus}
          onFocus={handleMobileSearchFocus}
        />
        {!isOpen && (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search the knowledge base..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Searching..." : "No results found."}
          </CommandEmpty>
          <CommandGroup heading="Articles">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelectResult(result)}
                className="flex flex-col items-start"
              >
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {getExcerpt(result.content, searchQuery)}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
