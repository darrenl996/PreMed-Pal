import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudyPlan } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Check, Circle } from "lucide-react";

interface StudyPlanCardProps {
  studyPlan: StudyPlan;
  courseName: string;
}

export function StudyPlanCard({ studyPlan, courseName }: StudyPlanCardProps) {
  const isNew = new Date(studyPlan.generatedAt).getTime() > Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days
  
  let planContent;
  try {
    planContent = JSON.parse(studyPlan.content);
  } catch (e) {
    planContent = { 
      title: "Study Plan", 
      description: "This study plan couldn't be parsed correctly.",
      weeks: [] 
    };
  }
  
  // Get total topics count
  const totalTopics = planContent.weeks?.reduce((acc: number, week: any) => 
    acc + (week.topics?.length || 0), 0) || 0;
  
  // Get duration in weeks
  const weeks = planContent.weeks?.length || 0;
  
  // Get first few topics from the first week for "Today's Focus"
  const firstWeekTopics = planContent.weeks?.[0]?.topics?.slice(0, 3) || [];

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{planContent.title || courseName}</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {totalTopics} topics • {weeks} week{weeks !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant={isNew ? "default" : "secondary"}>
            {isNew ? "New" : "Active"}
          </Badge>
        </div>
        
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <h4 className="text-sm font-medium mb-2">
            {isNew ? "Getting Started:" : "Today's Focus:"}
          </h4>
          
          {isNew ? (
            <p className="text-sm text-neutral-600">
              {planContent.description || "This AI-generated study plan is ready for you to begin studying. Start with the first topics in week 1."}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {firstWeekTopics.length > 0 ? (
                firstWeekTopics.map((topic: any, index: number) => (
                  <li key={index} className="flex items-center">
                    {index === 0 ? (
                      <Check className="text-secondary-500 h-4 w-4 mr-2" />
                    ) : (
                      <Circle className="text-neutral-300 h-4 w-4 mr-2" />
                    )}
                    <span>{topic.name}</span>
                  </li>
                ))
              ) : (
                <li className="text-neutral-600">No topics available</li>
              )}
            </ul>
          )}
        </div>
        
        <div className="mt-4 pt-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/study-plans/${studyPlan.id}`}>
              {isNew ? "Start Studying" : "Continue Studying"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
