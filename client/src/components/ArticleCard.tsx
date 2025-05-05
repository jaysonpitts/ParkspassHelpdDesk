import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  id: number;
  title: string;
  content: string;
  categoryName: string;
  updatedAt: string;
  imageUrl?: string;
}

export default function ArticleCard({
  id,
  title,
  content,
  categoryName,
  updatedAt,
  imageUrl
}: ArticleCardProps) {
  // Format the date
  const formattedDate = format(new Date(updatedAt), "MMM d, yyyy");
  
  // Create a preview from the content (strip markdown)
  const preview = content
    .replace(/#+\s+(.*?)\n/g, '') // Remove headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
    .replace(/[*_~`]/g, '') // Remove emphasis marks
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim()
    .substring(0, 120) + '...';

  return (
    <Link href={`/article/${id}`}>
      <a className="block h-full">
        <Card className={cn(
          "h-full overflow-hidden hover:shadow-md transition-shadow",
          "border border-gray-200 bg-white"
        )}>
          {imageUrl && (
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-2">
            <Badge variant="outline" className="bg-primary-50 text-xs font-medium text-primary-600 border-primary-100 py-0.5 px-2.5 w-fit">
              {categoryName}
            </Badge>
            <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 line-clamp-2">{preview}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-2">
            <span className="text-sm text-gray-500">Updated {formattedDate}</span>
            <span className="text-primary-600 font-medium hover:text-primary-700">Read more</span>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
