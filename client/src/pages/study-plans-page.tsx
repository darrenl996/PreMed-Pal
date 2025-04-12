import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { StudyPlanCard } from "@/components/study-plan-card";
import { CreateCourseDialog } from "@/components/create-course-dialog";
import { Course, StudyPlan } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Calendar, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudyPlansPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCourseId, setFilteredCourseId] = useState<string>("all");
  
  // Extract courseId from URL if it exists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    if (courseId) {
      setFilteredCourseId(courseId);
    }
  }, []);
  
  // Fetch all study plans
  const { 
    data: studyPlans = [], 
    isLoading: isStudyPlansLoading,
    isError: isStudyPlansError,
    refetch: refetchStudyPlans
  } = useQuery<StudyPlan[]>({ 
    queryKey: ["/api/study-plans"],
  });
  
  // Fetch all courses
  const {
    data: courses = [],
    isLoading: isCoursesLoading,
    isError: isCoursesError,
  } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  // Get course info for study plans
  const getCourseById = (courseId: number) => {
    return courses.find(c => c.id === courseId);
  };
  
  const isLoading = isStudyPlansLoading || isCoursesLoading;
  
  // Filter study plans by search and course
  const filteredStudyPlans = studyPlans
    .filter(plan => {
      // Filter by course if selected
      if (filteredCourseId !== "all" && filteredCourseId !== "active") {
        return plan.courseId === parseInt(filteredCourseId);
      } else if (filteredCourseId === "active") {
        return plan.isActive;
      }
      return true;
    })
    .filter(plan => {
      // Filter by search query
      if (!searchQuery) return true;
      
      try {
        const content = JSON.parse(plan.content);
        const courseTitle = getCourseById(plan.courseId)?.name || "";
        
        // Search in plan title, description, and course name
        return (
          (content.title && content.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (content.description && content.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  
  // Extract active courses that have study plans
  const activeCourses = courses
    .filter(course => studyPlans.some(plan => plan.courseId === course.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <Sidebar>
      <div className="p-6 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Study Plans</h1>
          <p className="text-neutral-600">
            View and manage your AI-generated study plans
          </p>
        </header>
        
        {/* Filter Tabs */}
        <Tabs 
          defaultValue={filteredCourseId !== "all" && filteredCourseId !== "active" ? "course" : filteredCourseId}
          onValueChange={(value) => {
            if (value !== "course") {
              setFilteredCourseId(value);
            }
          }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ScrollArea className="w-[calc(100%-100px)]">
              <TabsList>
                <TabsTrigger value="all">All Plans</TabsTrigger>
                <TabsTrigger value="active">Active Plans</TabsTrigger>
                {filteredCourseId !== "all" && filteredCourseId !== "active" && (
                  <TabsTrigger value="course">
                    {getCourseById(parseInt(filteredCourseId))?.name || "Selected Course"}
                  </TabsTrigger>
                )}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
            <div className="relative w-full md:w-auto flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search study plans..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={filteredCourseId !== "all" && filteredCourseId !== "active" ? filteredCourseId : "all"}
              onValueChange={setFilteredCourseId}
            >
              <SelectTrigger className="w-[220px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="active">Active Plans Only</SelectItem>
                <SelectItem value="divider" disabled>
                  <div className="h-px bg-neutral-200 my-1" />
                </SelectItem>
                {activeCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <TabsContent value="all">
            {renderStudyPlansList(false)}
          </TabsContent>
          
          <TabsContent value="active">
            {renderStudyPlansList(true)}
          </TabsContent>
          
          <TabsContent value="course">
            {renderStudyPlansList(false)}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Course Dialog */}
      <CreateCourseDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Sidebar>
  );
  
  function renderStudyPlansList(activeOnly: boolean) {
    // If active only, filter to only active study plans
    const plans = activeOnly 
      ? filteredStudyPlans.filter(plan => plan.isActive)
      : filteredStudyPlans;
      
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      );
    }
    
    if (isStudyPlansError || isCoursesError) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load study plans</p>
          <Button onClick={() => refetchStudyPlans()}>Try Again</Button>
        </div>
      );
    }
    
    if (plans.length === 0) {
      return (
        <div className="text-center py-16 border border-dashed rounded-lg">
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium mb-2">No study plans found</h3>
              <p className="text-neutral-500 mb-4">
                No study plans matching "{searchQuery}" were found.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </>
          ) : filteredCourseId !== "all" && filteredCourseId !== "active" ? (
            <>
              <h3 className="text-lg font-medium mb-2">No study plans for this course</h3>
              <p className="text-neutral-500 mb-4">
                Upload study materials to this course to generate study plans.
              </p>
              <Button 
                onClick={() => navigate(`/courses/${filteredCourseId}`)}
              >
                Go to Course
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">No study plans yet</h3>
              <p className="text-neutral-500 mb-4">
                Create a course and upload materials to generate study plans.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Course
              </Button>
            </>
          )}
        </div>
      );
    }
    
    // Group study plans by course
    const plansByCourseName: { [key: string]: { course: Course, plans: StudyPlan[] } } = {};
    
    plans.forEach(plan => {
      const course = getCourseById(plan.courseId);
      if (course) {
        const courseName = course.name;
        if (!plansByCourseName[courseName]) {
          plansByCourseName[courseName] = { course, plans: [] };
        }
        plansByCourseName[courseName].plans.push(plan);
      }
    });
    
    return (
      <div className="space-y-8">
        {Object.entries(plansByCourseName).map(([courseName, { course, plans }]) => (
          <div key={courseName}>
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-medium">{courseName}</h2>
              <Badge variant="outline" className="ml-3">
                {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Course
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              {plans.map((plan) => (
                <StudyPlanCard
                  key={plan.id}
                  studyPlan={plan}
                  courseName={courseName}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
