import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course, Material, StudyPlan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Upload, 
  Download, 
  Trash, 
  Loader2, 
  File 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Fetch course details
  const { 
    data: course,
    isLoading: isCourseLoading,
    isError: isCourseError,
  } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
    retry: 1,
  });
  
  // Fetch course materials
  const {
    data: materials = [],
    isLoading: isMaterialsLoading,
    isError: isMaterialsError,
  } = useQuery<Material[]>({
    queryKey: [`/api/courses/${courseId}/materials`],
    enabled: !!courseId,
  });
  
  // Fetch study plans for this course
  const {
    data: studyPlans = [],
    isLoading: isStudyPlansLoading,
    isError: isStudyPlansError,
  } = useQuery<StudyPlan[]>({
    queryKey: [`/api/courses/${courseId}/study-plans`],
    enabled: !!courseId,
  });
  
  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: number) => {
      await apiRequest("DELETE", `/api/materials/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/materials`] });
      toast({
        title: "Material deleted",
        description: "The material has been successfully deleted",
      });
      setMaterialToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete material",
        variant: "destructive",
      });
      setMaterialToDelete(null);
    },
  });
  
  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/courses/${courseId}/materials`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "File upload failed");
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/materials`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/study-plans`] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      
      toast({
        title: "Upload successful",
        description: "File uploaded and study plan generated",
      });
      
      setFile(null);
      setIsUploadDialogOpen(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file download
  const handleFileDownload = (materialId: number) => {
    window.open(`/api/materials/${materialId}/download`, '_blank');
  };
  
  if (isCourseError) {
    return (
      <Sidebar>
        <div className="p-6 md:p-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/courses")} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-neutral-600 mb-4">Failed to load course details</p>
            <Button onClick={() => navigate("/courses")}>Go to Courses</Button>
          </Card>
        </div>
      </Sidebar>
    );
  }

  const isLoading = isCourseLoading || isMaterialsLoading || isStudyPlansLoading;

  return (
    <Sidebar>
      <div className="p-6 md:p-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/courses")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isCourseLoading ? <Skeleton className="h-8 w-48" /> : course?.name}
          </h1>
        </div>
        
        {/* Course details */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Details
                <Button variant="outline" size="sm" onClick={() => navigate(`/study-plans?courseId=${courseId}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Study Plans
                </Button>
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
                  <p className="text-neutral-600 mb-4">
                    {course?.description || "No description provided"}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Created</p>
                      <p className="font-medium">
                        {course ? format(new Date(course.createdAt), 'PPP') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Last Updated</p>
                      <p className="font-medium">
                        {course ? format(new Date(course.updatedAt), 'PPP') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Materials</p>
                      <p className="font-medium">{materials.length}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Study Plans</p>
                      <p className="font-medium">{studyPlans.length}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/study-plans?courseId=${courseId}`)}>
                <FileText className="h-4 w-4 mr-2" />
                View Study Plans
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Materials list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Course Materials</h2>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
          
          {isMaterialsLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded mr-3" />
                      <div>
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-9 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isMaterialsError ? (
            <Card className="p-6 text-center">
              <p className="text-red-600 mb-2">Failed to load materials</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/materials`] })}>
                Try Again
              </Button>
            </Card>
          ) : materials.length === 0 ? (
            <Card className="p-8 text-center">
              <File className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Materials Yet</h3>
              <p className="text-neutral-500 mb-4">
                Upload course materials to generate AI study plans.
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {materials.map((material) => (
                <Card key={material.id} className="p-4">
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <div className="bg-primary-100 text-primary-700 p-2 rounded mr-3">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-medium">{material.originalName}</h3>
                        <p className="text-xs text-neutral-500">
                          Uploaded {format(new Date(material.uploadedAt), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleFileDownload(material.id)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setMaterialToDelete(material.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Study Plans Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Study Plans</h2>
            <Button variant="outline" onClick={() => navigate(`/study-plans?courseId=${courseId}`)}>
              View All Plans
            </Button>
          </div>
          
          {isStudyPlansLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
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
          ) : isStudyPlansError ? (
            <Card className="p-6 text-center">
              <p className="text-red-600 mb-2">Failed to load study plans</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/study-plans`] })}>
                Try Again
              </Button>
            </Card>
          ) : studyPlans.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Study Plans Yet</h3>
              <p className="text-neutral-500 mb-4">
                Upload course materials to generate AI study plans.
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {studyPlans.slice(0, 2).map((plan) => {
                let planContent;
                try {
                  planContent = JSON.parse(plan.content);
                } catch (e) {
                  planContent = { title: "Study Plan", weeks: [] };
                }
                
                const totalTopics = planContent.weeks?.reduce((acc: number, week: any) => 
                  acc + (week.topics?.length || 0), 0) || 0;
                
                return (
                  <Card key={plan.id} className="p-4">
                    <h3 className="font-medium mb-1">{planContent.title || "Study Plan"}</h3>
                    <p className="text-sm text-neutral-500 mb-3">
                      {totalTopics} topics • Generated {format(new Date(plan.generatedAt), 'PP')}
                    </p>
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                      {planContent.description || "This AI-generated study plan is based on your course materials."}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/study-plans/${plan.id}`)}
                    >
                      View Plan
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Upload Material Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Course Material</DialogTitle>
            <DialogDescription>
              Upload syllabus, notes, or textbook content to generate a study plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                id="file-upload-course" 
                className="hidden" 
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.txt"
              />
              <Button 
                type="button" 
                variant="secondary" 
                className="mt-4 mx-auto"
                onClick={() => document.getElementById("file-upload-course")?.click()}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
            
            {file && (
              <div className="bg-neutral-50 p-3 rounded border border-neutral-200">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-neutral-500 mr-2" />
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-neutral-500">{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Generate Study Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Material Confirmation */}
      <AlertDialog 
        open={materialToDelete !== null} 
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => materialToDelete !== null && deleteMaterialMutation.mutate(materialToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMaterialMutation.isPending ? (
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
