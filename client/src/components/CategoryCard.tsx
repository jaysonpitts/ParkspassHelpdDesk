import { ReactNode } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
}

export default function CategoryCard({ id, title, description, icon }: CategoryCardProps) {
  return (
    <Link href={`/category/${id}`}>
      <a className="block h-full">
        <Card className={cn(
          "h-full transition-shadow hover:shadow-md",
          "border border-gray-200 bg-white"
        )}>
          <CardHeader className="pb-2">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
              {icon}
            </div>
            <CardTitle className="text-lg font-medium text-gray-900">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-600 mb-4">{description}</CardDescription>
          </CardContent>
          <CardFooter>
            <span className="text-primary-600 text-sm font-medium flex items-center">
              Browse articles <ChevronRightIcon className="ml-1 h-4 w-4" />
            </span>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
