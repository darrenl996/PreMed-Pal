import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Course } from "@shared/schema";
import { Book, FileText, MoreVertical } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CourseCardProps {
  course: Course;
  onDelete: (id: number) => void;
}

export function CourseCard({ course, onDelete }: CourseCardProps) {
  const isNewCourse = new Date(course.createdAt).getTime() > Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days
  
  const updatedTimeAgo = formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true });
  
  const gradientColors = [
    "from-primary-500 to-primary-700", 
    "from-accent-500 to-accent-700",
    "from-blue-500 to-blue-700",
    "from-purple-500 to-purple-700",
    "from-emerald-500 to-emerald-700"
  ];
  
  // Use course ID to determine a consistent color
  const gradientClass = gradientColors[course.id % gradientColors.length];

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className={`h-32 bg-gradient-to-r ${gradientClass} p-4 flex items-end`}>
        <h3 className="text-white font-bold text-lg">{course.name}</h3>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <Badge variant={isNewCourse ? "default" : "secondary"}>
            {isNewCourse ? "New" : "In Progress"}
          </Badge>
          <span className="text-xs text-neutral-500">
            Updated {updatedTimeAgo}
          </span>
        </div>
        <p className="text-sm text-neutral-600 mb-4 flex-grow">
          {course.description || "No description provided."}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${course.id}`}>
                <Book className="mr-1 h-4 w-4" />
                Materials
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/study-plans?courseId=${course.id}`}>
                <FileText className="mr-1 h-4 w-4" />
                Study Plan
              </Link>
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/courses/${course.id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(course.id)}>
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
