import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Check, 
  Circle, 
  Printer,
  ExternalLink
} from "lucide-react";
import { StudyPlan, Course } from "@shared/schema";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudyPlanContent {
  title: string;
  description: string;
  weeks: Array<{
    weekNumber: number;
    topics: Array<{
      name: string;
      description: string;
      estimatedHours: number;
      resources: string[];
    }>;
  }>;
}

export default function StudyPlanPage() {
  const params = useParams<{ id: string }>();
  const studyPlanId = parseInt(params.id);
  const [, navigate] = useLocation();
  const [activeWeek, setActiveWeek] = useState(1);
  
  // Fetch study plan details
  const { 
    data: studyPlan,
    isLoading: isStudyPlanLoading,
    isError: isStudyPlanError,
  } = useQuery<StudyPlan>({
    queryKey: [`/api/study-plans/${studyPlanId}`],
    retry: 1,
  });
  
  // Fetch course details if study plan is loaded
  const {
    data: course,
    isLoading: isCourseLoading,
    isError: isCourseError,
  } = useQuery<Course>({
    queryKey: [`/api/courses/${studyPlan?.courseId}`],
    enabled: !!studyPlan?.courseId,
  });
  
  // Parse study plan content
  const [planContent, setPlanContent] = useState<StudyPlanContent>({
    title: "",
    description: "",
    weeks: []
  });
  
  useEffect(() => {
    if (studyPlan) {
      try {
        const parsed = JSON.parse(studyPlan.content);
        setPlanContent(parsed);
      } catch (e) {
        console.error("Failed to parse study plan content:", e);
      }
    }
  }, [studyPlan]);
  
  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };
  
  const isLoading = isStudyPlanLoading || isCourseLoading;
  
  if (isStudyPlanError) {
    return (
      <Sidebar>
        <div className="p-6 md:p-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/study-plans")} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-neutral-600 mb-4">Failed to load study plan details</p>
            <Button onClick={() => navigate("/study-plans")}>Go to Study Plans</Button>
          </Card>
        </div>
      </Sidebar>
    );
  }
  
  // Calculate total study hours
  const totalHours = planContent.weeks.reduce((total, week) => {
    return total + week.topics.reduce((weekTotal, topic) => weekTotal + topic.estimatedHours, 0);
  }, 0);
  
  // Get topics for the active week
  const activeWeekTopics = planContent.weeks.find(w => w.weekNumber === activeWeek)?.topics || [];
  
  // Calculate overall progress (random for demo purposes - in a real app this would be tracked)
  const progress = Math.min(85, Math.floor(Math.random() * 100));

  return (
    <Sidebar>
      <div className="p-6 md:p-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate("/study-plans")} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-48" /> : planContent.title || "Study Plan"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
        
        {/* Course Info and Study Plan Meta */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Study Plan Overview
                {course && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${course.id}`)} className="print:hidden">
                    <FileText className="h-4 w-4 mr-2" />
                    Course Materials
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  <p className="text-neutral-600 mb-6">
                    {planContent.description || "This AI-generated study plan is designed to help you learn efficiently."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-y-6 text-sm">
                    <div>
                      <p className="text-neutral-500">Course</p>
                      <p className="font-medium">{course?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Generated</p>
                      <p className="font-medium">
                        {studyPlan ? format(new Date(studyPlan.generatedAt), 'PPP') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Duration</p>
                      <p className="font-medium">{planContent.weeks.length} Weeks</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Total Study Time</p>
                      <p className="font-medium">{totalHours} Hours</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Completion</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                      Current Focus
                    </h3>
                    <div className="space-y-2 text-sm">
                      {activeWeekTopics.length > 0 ? (
                        <>
                          <p className="text-neutral-600">Week {activeWeek} Topics:</p>
                          <ul className="space-y-1">
                            {activeWeekTopics.slice(0, 3).map((topic, i) => (
                              <li key={i} className="flex items-center">
                                {i === 0 ? (
                                  <Check className="h-4 w-4 text-secondary-500 mr-2 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-neutral-300 mr-2 flex-shrink-0" />
                                )}
                                <span className="truncate">{topic.name}</span>
                              </li>
                            ))}
                            {activeWeekTopics.length > 3 && (
                              <li className="text-neutral-500 text-xs italic pl-6">
                                +{activeWeekTopics.length - 3} more topics
                              </li>
                            )}
                          </ul>
                        </>
                      ) : (
                        <p className="text-neutral-500">No topics found for current week</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Weekly Study Plan */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Weekly Study Plan</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : planContent.weeks.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-neutral-600 mb-2">No weekly plan is available.</p>
            </Card>
          ) : (
            <>
              <Tabs defaultValue={activeWeek.toString()} onValueChange={(value) => setActiveWeek(parseInt(value))}>
                <div className="overflow-x-auto pb-2">
                  <TabsList className="mb-4">
                    {planContent.weeks.map((week) => (
                      <TabsTrigger key={week.weekNumber} value={week.weekNumber.toString()}>
                        Week {week.weekNumber}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {planContent.weeks.map((week) => (
                  <TabsContent key={week.weekNumber} value={week.weekNumber.toString()}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Week {week.weekNumber} Study Topics
                          <Badge variant="secondary">
                            {week.topics.reduce((total, topic) => total + topic.estimatedHours, 0)} hours
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {week.topics.map((topic, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium flex items-center">
                                  <Circle className="h-4 w-4 text-primary-600 mr-2" />
                                  {topic.name}
                                </h3>
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {topic.estimatedHours} {topic.estimatedHours === 1 ? 'hour' : 'hours'}
                                </div>
                              </div>
                              <p className="text-sm text-neutral-600 pl-6">{topic.description}</p>
                              
                              {topic.resources && topic.resources.length > 0 && (
                                <div className="pl-6 mt-2">
                                  <p className="text-xs font-medium text-neutral-500 mb-1">Study Resources:</p>
                                  <ul className="space-y-1 text-sm">
                                    {topic.resources.map((resource, i) => (
                                      <li key={i} className="flex items-center text-primary-600">
                                        <ExternalLink className="h-3 w-3 mr-1.5" />
                                        {resource}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {index < week.topics.length - 1 && (
                                <Separator className="mt-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>
        
        {/* Study Tips */}
        <div className="print:break-before-page">
          <h2 className="text-xl font-bold mb-4">Study Tips</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-600 mr-2" />
                    Effective Study Strategies
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Use active recall by testing yourself frequently rather than passive re-reading</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Space out your study sessions for better long-term retention (spaced repetition)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Teach concepts to others to solidify your understanding</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Use concept maps to connect ideas visually</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-primary-600 mr-2" />
                    Optimize Your Study Environment
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Find a quiet, dedicated study space with minimal distractions</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Use the Pomodoro technique: 25 minutes of focus followed by 5-minute breaks</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Stay hydrated and take regular brain breaks for optimal cognitive function</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-secondary-500 mr-2 mt-0.5" />
                      <span>Alternate between different subjects to maintain engagement and prevent burnout</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
}
