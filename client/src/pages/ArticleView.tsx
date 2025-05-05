import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ChevronLeftIcon, ChevronRightIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Article, Category } from "@shared/schema";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function ArticleView() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const articleId = parseInt(id);

  // Fetch the article
  const { data: article, isLoading: isArticleLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !isNaN(articleId),
  });

  // Fetch the category for breadcrumbs
  const { data: category, isLoading: isCategoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${article?.categoryId}`],
    enabled: !!article?.categoryId,
  });

  // Fetch related articles from the same category
  const { data: relatedArticles } = useQuery<Article[]>({
    queryKey: [`/api/articles/category/${article?.categoryId}`],
    enabled: !!article?.categoryId,
  });

  // Filter out the current article from related articles and limit to 3
  const filteredRelatedArticles = relatedArticles
    ?.filter(relatedArticle => relatedArticle.id !== articleId)
    .slice(0, 3);

  // Format publication date
  const formattedDate = article 
    ? format(new Date(article.updatedAt), "MMMM d, yyyy") 
    : "";

  const isLoading = isArticleLoading || isCategoryLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-16 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/")}>Return to Help Center</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm mb-6">
          <Link href="/">
            <a className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Help Center
            </a>
          </Link>
          <ChevronRightIcon className="h-4 w-4 mx-2 text-gray-400" />
          
          {category && (
            <>
              <Link href={`/category/${category.id}`}>
                <a className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  {category.name}
                </a>
              </Link>
              <ChevronRightIcon className="h-4 w-4 mx-2 text-gray-400" />
            </>
          )}
          
          <span className="text-gray-900 dark:text-gray-100 truncate">
            {article.title}
          </span>
        </nav>

        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center text-primary-600 hover:text-primary-700 p-0 dark:text-primary-500 dark:hover:text-primary-400"
          onClick={() => navigate("/")}
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Back to Help Center
        </Button>

        {/* Article Content */}
        <Card className="p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {article.title}
          </h1>
          
          <div className="flex items-center text-sm text-gray-500 mb-8 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span>Updated on {formattedDate}</span>
          </div>
          
          <div className="prose prose-blue max-w-none dark:prose-invert markdown-content">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </Card>

        {/* Related Articles */}
        {filteredRelatedArticles && filteredRelatedArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Related Articles
            </h2>
            <div className="space-y-4">
              {filteredRelatedArticles.map(relatedArticle => (
                <Card 
                  key={relatedArticle.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/article/${relatedArticle.id}`)}
                >
                  <h3 className="font-medium text-primary-600 dark:text-primary-500">
                    {relatedArticle.title}
                  </h3>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Help Prompt */}
        <div className="mt-8 bg-gray-100 p-6 rounded-lg text-center dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
            Was this article helpful?
          </h3>
          <p className="text-gray-600 mb-4 dark:text-gray-300">
            If you need more assistance, we're here to help.
          </p>
          <Button onClick={() => navigate("/submit-ticket")}>
            Submit a Request
          </Button>
        </div>
      </div>
    </div>
  );
}
