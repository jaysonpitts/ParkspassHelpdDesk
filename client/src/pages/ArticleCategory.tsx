import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ArticleCard from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Article, Category } from "@shared/schema";

export default function ArticleCategory() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const categoryId = parseInt(id);

  // Fetch the category
  const { data: category, isLoading: isCategoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${categoryId}`],
    enabled: !isNaN(categoryId),
  });

  // Fetch articles by category
  const { data: articles, isLoading: isArticlesLoading } = useQuery<Article[]>({
    queryKey: [`/api/articles/category/${categoryId}`],
    enabled: !isNaN(categoryId),
  });

  const isLoading = isCategoryLoading || isArticlesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-3/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="mb-6">The category you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/")}>Return to Help Center</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-6 flex items-center text-primary-600 hover:text-primary-700 p-0 dark:text-primary-500 dark:hover:text-primary-400"
        onClick={() => navigate("/")}
      >
        <ChevronLeftIcon className="mr-2 h-4 w-4" />
        Back to Help Center
      </Button>

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 dark:text-gray-300">
            {category.description}
          </p>
        )}
      </div>

      {/* Articles grid */}
      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              content={article.content}
              categoryName={category.name}
              updatedAt={article.updatedAt.toString()}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No Articles Found</h2>
          <p className="text-gray-600 dark:text-gray-300">
            There are currently no articles in this category.
          </p>
        </Card>
      )}
    </div>
  );
}
