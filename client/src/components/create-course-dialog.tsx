import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCourseSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Extend the course schema to make fields required
const createCourseSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters"),
  description: z.string().optional(),
});

type CreateCourseFormData = z.infer<typeof createCourseSchema>;

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const onSubmit = async (data: CreateCourseFormData) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // First create the course
      const courseResponse = await apiRequest("POST", "/api/courses", data);
      const course = await courseResponse.json();
      
      // If a file was selected, upload it
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        // Upload file and generate study plan
        await fetch(`/api/courses/${course.id}/materials`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        toast({
          title: "Success!",
          description: "Course created and study plan generated",
        });
      } else {
        toast({
          title: "Course created",
          description: "Course has been created successfully",
        });
      }
      
      // Invalidate and refetch to immediately update the UI
      await queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      await queryClient.refetchQueries({ queryKey: ["/api/courses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      await queryClient.refetchQueries({ queryKey: ["/api/study-plans"] });
      
      // Reset form and close dialog
      form.reset();
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Add course details and upload materials to generate a study plan.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Organic Chemistry 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the course content and your learning goals" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Course Materials</FormLabel>
              <div className="border-2 border-dashed border-neutral-200 rounded-md p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-neutral-500" />
                </div>
                <p className="text-sm text-neutral-700 font-medium">
                  {file ? file.name : "Drag files here or click to upload"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Upload syllabus, notes, or textbook content (PDF, DOC, TXT)
                </p>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="mt-4 mx-auto"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Course & Generate Study Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
