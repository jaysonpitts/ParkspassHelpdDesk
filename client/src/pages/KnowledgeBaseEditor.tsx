import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MarkdownEditor from "@/components/MarkdownEditor";
import AgentSidebar from "@/components/AgentSidebar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Article, Category } from "@shared/schema";

export default function KnowledgeBaseEditor() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const articleId = id ? parseInt(id) : undefined;
  const isNewArticle = articleId === undefined;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for article content
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [isPublished, setIsPublished] = useState(true);

  // Fetch article if editing existing one
  const { data: article, isLoading: isArticleLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!articleId,
  });

  // Fetch categories for dropdown
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Set form values when article loads
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setCategoryId(article.categoryId);
      setIsPublished(article.isPublished);
    }
  }, [article]);

  // Create/update article mutation
  const mutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      content: string; 
      categoryId?: number; 
      isPublished: boolean;
    }) => {
      if (isNewArticle) {
        const response = await apiRequest("POST", "/api/articles", data);
        return response.json();
      } else {
        const response = await apiRequest("PATCH", `/api/articles/${articleId}`, data);
        return response.json();
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      if (articleId) {
        queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
      }
      
      toast({
        title: isNewArticle ? "Article created" : "Article updated",
        description: isNewArticle 
          ? "Your article has been created successfully." 
          : "Your article has been updated successfully.",
      });
      
      // Navigate to the article page if it's a new article
      if (isNewArticle && data?.id) {
        navigate(`/admin/kb/editor/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isNewArticle ? "create" : "update"} article.`,
        variant: "destructive",
      });
      console.error("Article mutation error:", error);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Validation error",
        description: "Content is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!categoryId) {
      toast({
        title: "Validation error",
        description: "Category is required.",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate({ title, content, categoryId, isPublished });
  };

  const isLoading = isArticleLoading || isCategoriesLoading;

  return (
    <div className="flex h-screen overflow-hidden">
      <AgentSidebar activePage="knowledge" />
      
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
              <h1 className="text-2xl font-semibold">
                {isNewArticle ? "Create New Article" : "Edit Article"}
              </h1>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={mutation.isPending || isLoading}
              className="flex items-center"
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save Article"}
            </Button>
          </div>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="font-medium">Article Details</h2>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                    <Label htmlFor="published">
                      {isPublished ? "Published" : "Draft"}
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Article title"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={categoryId?.toString()} 
                        onValueChange={(value) => setCategoryId(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <div className="mt-1">
                        <MarkdownEditor
                          value={content}
                          onChange={setContent}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
