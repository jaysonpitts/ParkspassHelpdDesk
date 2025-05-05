import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Article, Category } from "@shared/schema";

export function useKnowledgeBase() {
  const queryClient = useQueryClient();

  // Get all categories
  const getAllCategories = () => {
    return useQuery<Category[]>({
      queryKey: ['/api/categories'],
    });
  };

  // Get a specific category
  const getCategory = (categoryId: number) => {
    return useQuery<Category>({
      queryKey: [`/api/categories/${categoryId}`],
      enabled: !!categoryId,
    });
  };

  // Get all articles
  const getAllArticles = () => {
    return useQuery<Article[]>({
      queryKey: ['/api/articles'],
    });
  };

  // Get published articles
  const getPublishedArticles = () => {
    return useQuery<Article[]>({
      queryKey: ['/api/articles?published=true'],
    });
  };

  // Get a specific article
  const getArticle = (articleId: number) => {
    return useQuery<Article>({
      queryKey: [`/api/articles/${articleId}`],
      enabled: !!articleId,
    });
  };

  // Get articles by category
  const getArticlesByCategory = (categoryId: number) => {
    return useQuery<Article[]>({
      queryKey: [`/api/articles/category/${categoryId}`],
      enabled: !!categoryId,
    });
  };

  // Search articles
  const searchArticles = (query: string) => {
    return useQuery<Article[]>({
      queryKey: [`/api/articles/search?q=${query}`],
      enabled: !!query && query.length >= 2,
    });
  };

  // Create a category
  const createCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiRequest("POST", "/api/categories", categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  // Update a category
  const updateCategory = useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/categories/${categoryId}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${variables.categoryId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });

  // Create an article
  const createArticle = useMutation({
    mutationFn: async (articleData: any) => {
      const response = await apiRequest("POST", "/api/articles", articleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    },
  });

  // Update an article
  const updateArticle = useMutation({
    mutationFn: async ({ articleId, data }: { articleId: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/articles/${articleId}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${variables.articleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      // Also invalidate any category queries if this article might be shown in a category list
      if (variables.data.categoryId) {
        queryClient.invalidateQueries({ queryKey: [`/api/articles/category/${variables.data.categoryId}`] });
      }
    },
  });

  return {
    getAllCategories,
    getCategory,
    getAllArticles,
    getPublishedArticles,
    getArticle,
    getArticlesByCategory,
    searchArticles,
    createCategory,
    updateCategory,
    createArticle,
    updateArticle,
  };
}
