import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { StudyPlanCard } from "@/components/study-plan-card";
import { Card } from "@/components/ui/card";
import { CreateCourseDialog } from "@/components/create-course-dialog";
import { Course, StudyPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
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
import { Plus, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  
  // Fetch courses
  const { 
    data: courses = [], 
    isLoading: isCoursesLoading,
    isError: isCoursesError,
  } = useQuery<Course[]>({ 
    queryKey: ["/api/courses"],
  });
  
  // Fetch study plans
  const {
    data: studyPlans = [],
    isLoading: isStudyPlansLoading,
    isError: isStudyPlansError,
  } = useQuery<StudyPlan[]>({
    queryKey: ["/api/study-plans"],
  });
  
  // Delete course handler
  const handleDeleteCourse = async () => {
    if (courseToDelete === null) return;
    
    try {
      await apiRequest("DELETE", `/api/courses/${courseToDelete}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      
      toast({
        title: "Course deleted",
        description: "The course has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the course",
        variant: "destructive",
      });
    } finally {
      setCourseToDelete(null);
    }
  };
  
  // Get recent courses
  const recentCourses = [...courses].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 2);
  
  // Get recent study plans
  const recentStudyPlans = [...studyPlans].sort((a, b) => 
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  ).slice(0, 2);
  
  // Get course info for study plans
  const getCourseNameById = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || "Unknown Course";
  };
  
  // Render progress skeletons when loading
  const renderSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
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
    ));
  };

  return (
    <Sidebar>
      <div className="p-6 md:p-8">
        {/* Dashboard Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-neutral-600">
            Welcome back, {user?.fullName || "Student"}! Here's your learning progress.
          </p>
        </header>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium text-neutral-500">Courses</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{courses.length}</p>
                {courses.length > 0 && (
                  <span className="text-secondary-600 flex items-center text-sm">
                    <ArrowUp className="mr-1 h-4 w-4" /> {Math.min(courses.length, 1)} new
                  </span>
                )}
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium text-neutral-500">Study Plans</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{studyPlans.length}</p>
                {studyPlans.length > 0 && (
                  <span className="text-primary-600 flex items-center text-sm">
                    <ArrowUp className="mr-1 h-4 w-4" /> {Math.min(studyPlans.length, 2)} new
                  </span>
                )}
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium text-neutral-500">Study Time</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">0h</p>
                <span className="text-secondary-600 flex items-center text-sm">
                  <ArrowUp className="mr-1 h-4 w-4" /> This week
                </span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Recent Progress - Would track actual progress in a real app */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Progress</h2>
            <Link href="/courses">
              <a className="text-sm text-primary-600 hover:underline">View all</a>
            </Link>
          </div>
          
          <Card className="p-4">
            <div className="space-y-4">
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No courses yet. Create your first course to track progress.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              ) : (
                recentCourses.map((course) => (
                  <div key={course.id} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{course.name}</h3>
                        <p className="text-sm text-neutral-500">
                          {course.description ? 
                            `${course.description.substring(0, 40)}${course.description.length > 40 ? '...' : ''}` : 
                            'No description provided'
                          }
                        </p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(course.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-neutral-100 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${Math.floor(Math.random() * 70) + 10}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-neutral-500">Progress</span>
                        <span className="text-xs font-medium">In progress</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Courses</h2>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isCoursesLoading ? (
                renderSkeletons(3)
              ) : isCoursesError ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-red-500">Failed to load courses. Please try again.</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-neutral-500">No courses yet. Get started by creating your first course.</p>
                </div>
              ) : (
                <>
                  {courses.slice(0, 3).map((course) => (
                    <CourseCard 
                      key={course.id} 
                      course={course} 
                      onDelete={(id) => setCourseToDelete(id)}
                    />
                  ))}
                  
                  {courses.length <= 3 && (
                    <Card className="border-dashed border-2 flex items-center justify-center h-64 cursor-pointer hover:bg-neutral-50" onClick={() => setIsCreateDialogOpen(true)}>
                      <div className="text-center p-6">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mx-auto mb-3">
                          <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-neutral-900">Add New Course</h3>
                        <p className="text-sm text-neutral-500 mt-1">Upload course materials to generate a study plan</p>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Recent Study Plans */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Study Plans</h2>
              <Link href="/study-plans">
                <a className="text-sm text-primary-600 hover:underline">View all</a>
              </Link>
            </div>
            
            <div className="space-y-4">
              {isStudyPlansLoading ? (
                renderSkeletons(2)
              ) : isStudyPlansError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Failed to load study plans. Please try again.</p>
                </div>
              ) : studyPlans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No study plans yet. Create a course and upload materials to generate study plans.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              ) : (
                recentStudyPlans.map((plan) => (
                  <StudyPlanCard 
                    key={plan.id} 
                    studyPlan={plan} 
                    courseName={getCourseNameById(plan.courseId)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
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
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
