import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CreateCourseDialog } from "@/components/create-course-dialog";
import { Course } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, SortAsc, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("updated");

  // Fetch courses
  const { 
    data: courses = [], 
    isLoading,
    isError,
    refetch
  } = useQuery<Course[]>({ 
    queryKey: ["/api/courses"],
  });
  
  // Delete course handler
  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course deleted",
        description: "The course has been successfully deleted",
      });
      setCourseToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
      setCourseToDelete(null);
    },
  });
  
  // Handle delete course
  const handleDeleteCourse = () => {
    if (courseToDelete !== null) {
      deleteMutation.mutate(courseToDelete);
    }
  };
  
  // Filter and sort courses
  const filteredCourses = courses
    .filter(course => 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  
  return (
    <Sidebar>
      <div className="p-6 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-neutral-600">
            Manage your courses and study materials
          </p>
        </header>
        
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
          <div className="relative w-full md:w-auto flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search courses..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Select
              defaultValue={sortOption}
              onValueChange={setSortOption}
            >
              <SelectTrigger className="w-[180px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="name">Course Name</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </div>
        </div>
        
        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex space-x-2 pt-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load courses</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-neutral-500 mb-4">
                  No courses matching "{searchQuery}" were found.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-neutral-500 mb-4">
                  Get started by creating your first course.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Course
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onDelete={(id) => setCourseToDelete(id)}
              />
            ))}
            
            {/* Add New Course Card */}
            <Card className="border-dashed border-2 flex items-center justify-center h-64 cursor-pointer hover:bg-neutral-50" onClick={() => setIsCreateDialogOpen(true)}>
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mx-auto mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-neutral-900">Add New Course</h3>
                <p className="text-sm text-neutral-500 mt-1">Upload course materials to generate a study plan</p>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      {/* Create Course Dialog */}
      <CreateCourseDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={courseToDelete !== null} 
        onOpenChange={(open) => !open && setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course and all associated study materials and plans.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
