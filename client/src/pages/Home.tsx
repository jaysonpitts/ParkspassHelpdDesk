import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TicketIcon, TentTree, CreditCardIcon, Network, LaptopIcon } from "lucide-react";
import CategoryCard from "@/components/CategoryCard";
import ArticleCard from "@/components/ArticleCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Category, Article } from "@shared/schema";

// Icons for categories
const categoryIcons: Record<string, JSX.Element> = {
  "ticket-alt": <TicketIcon className="h-6 w-6" />,
  "campground": <TentTree className="h-6 w-6" />,
  "credit-card": <CreditCardIcon className="h-6 w-6" />,
  "tree": <Network className="h-6 w-6" />,
  "laptop": <LaptopIcon className="h-6 w-6" />
};

export default function Home() {
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch articles
  const { data: articles } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
  });

  // Filter for featured articles (latest updated)
  const featuredArticles = articles?.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 2);

  // Get category name for each article
  const [articleWithCategories, setArticleWithCategories] = useState<
    Array<Article & { categoryName: string }>
  >([]);

  useEffect(() => {
    if (featuredArticles && categories) {
      const enriched = featuredArticles.map(article => {
        const category = categories.find(c => c.id === article.categoryId);
        return {
          ...article,
          categoryName: category?.name || "Uncategorized"
        };
      });
      setArticleWithCategories(enriched);
    }
  }, [featuredArticles, categories]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-500 rounded-xl text-white p-8 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">How can we help you?</h1>
          <p className="text-lg opacity-90 mb-6">
            Find answers, guides, and expert advice for your Parkspass experience
          </p>
          <div className="max-w-xl mx-auto">
            {/* Search is handled by the global SearchBar component in the header */}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 dark:text-gray-100">
          Popular Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories?.map(category => (
            <CategoryCard
              key={category.id}
              id={category.id}
              title={category.name}
              description={category.description || ""}
              icon={categoryIcons[category.icon || "ticket-alt"]}
            />
          ))}
        </div>
      </section>

      {/* Featured Articles */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Featured Articles</h2>
          <Link href="/articles">
            <a className="text-primary-600 hover:text-primary-700 font-medium dark:text-primary-500 dark:hover:text-primary-400">
              View all
            </a>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articleWithCategories.map((article, index) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              content={article.content}
              categoryName={article.categoryName}
              updatedAt={article.updatedAt.toString()}
              imageUrl={index === 0 ? 
                "https://images.unsplash.com/photo-1609924211018-5526c55bad5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" : 
                "https://images.unsplash.com/photo-1539183204366-63a0589187ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              }
            />
          ))}
        </div>
      </section>

      {/* Quick Help Section */}
      <section className="bg-gray-100 rounded-xl p-8 mb-12 dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 dark:text-gray-100">Need more help?</h2>
            <p className="text-gray-600 mb-6 dark:text-gray-300">
              Can't find what you're looking for? Our support team is here to help you with any questions or issues.
            </p>
            <Link href="/submit-ticket">
              <Button size="lg">
                Submit a Request
              </Button>
            </Link>
          </div>
          <div className="flex flex-col justify-center">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Support Hours</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Monday-Friday: 8am-8pm MT</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Weekends: 9am-5pm MT</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Contact Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Email: support@parkspass.com</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Phone: (800) 555-PARK</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
