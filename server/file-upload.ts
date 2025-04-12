import express, { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { insertMaterialSchema } from "@shared/schema";
import axios from "axios";

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter to only allow certain types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only pdf, doc, docx, and txt files
  const allowedMimeTypes = [
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."));
  }
};

// Initialize multer upload
const upload = multer({ 
  storage: multerStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Function to generate study plan from an uploaded file 
async function generateStudyPlan(filePath: string): Promise<string> {
  try {
    // In a real implementation, this would use the AI API to analyze the file
    // and generate a study plan. For now, we'll return a default plan.
    // Here we would read the file content and send it to an AI API
    
    // This is a placeholder - in reality, we would use the real AI API
    // const aiResponse = await axios.post("https://aimlapi.example.com/analyze", {
    //   file: fs.readFileSync(filePath, 'utf-8')
    // });
    
    // Return a simulated AI response for demonstration
    return JSON.stringify({
      title: "Study Plan",
      description: "This study plan was generated based on your uploaded materials.",
      weeks: [
        {
          weekNumber: 1,
          topics: [
            {
              name: "Introduction to Topic",
              description: "Basic overview of the subject matter",
              estimatedHours: 3,
              resources: ["Read Chapter 1", "Watch introductory video"]
            },
            {
              name: "Fundamental Concepts",
              description: "Core principles and foundational knowledge",
              estimatedHours: 4,
              resources: ["Review practice problems", "Create flashcards for key terms"]
            }
          ]
        },
        {
          weekNumber: 2,
          topics: [
            {
              name: "Advanced Applications",
              description: "Applying concepts to complex problems",
              estimatedHours: 5,
              resources: ["Complete problem set", "Join study group discussion"]
            },
            {
              name: "Review and Practice",
              description: "Consolidating knowledge through practice",
              estimatedHours: 3,
              resources: ["Take practice quiz", "Review difficult concepts"]
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Failed to generate study plan");
  }
}

export function setupFileUploadRoutes(app: express.Express) {
  const router = Router();
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "You must be logged in" });
  };

  // Upload a file for a specific course
  router.post("/courses/:courseId/materials", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const courseId = parseInt(req.params.courseId);
      const userId = (req.user as Express.User).id;
      
      // Check if course exists and belongs to user
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to upload to this course" });
      }
      
      // Create material record
      const materialData = {
        courseId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
      };
      
      const validatedData = insertMaterialSchema.parse(materialData);
      const material = await storage.createMaterial(validatedData);
      
      // Generate study plan from uploaded file
      const studyPlanContent = await generateStudyPlan(req.file.path);
      
      // Create study plan record
      const studyPlan = await storage.createStudyPlan({
        courseId,
        content: studyPlanContent,
        isActive: true
      });
      
      res.status(201).json({ 
        message: "File uploaded and study plan generated",
        material,
        studyPlan
      });
    } catch (error) {
      console.error("Error handling file upload:", error);
      
      // If the file was uploaded but processing failed, clean it up
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });
  
  // Get all materials for a course
  router.get("/courses/:courseId/materials", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = (req.user as Express.User).id;
      
      // Check if course exists and belongs to user
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this course" });
      }
      
      const materials = await storage.getMaterialsByCourseId(courseId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });
  
  // Download a specific material
  router.get("/materials/:materialId/download", isAuthenticated, async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const userId = (req.user as Express.User).id;
      
      // Get the material
      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check if course belongs to user
      const course = await storage.getCourse(material.courseId);
      if (!course || course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this file" });
      }
      
      // Send the file
      res.download(material.path, material.originalName);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });
  
  // Delete a material
  router.delete("/materials/:materialId", isAuthenticated, async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const userId = (req.user as Express.User).id;
      
      // Get the material
      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Check if course belongs to user
      const course = await storage.getCourse(material.courseId);
      if (!course || course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this file" });
      }
      
      // Delete file from filesystem
      if (fs.existsSync(material.path)) {
        fs.unlinkSync(material.path);
      }
      
      // Delete from storage
      await storage.deleteMaterial(materialId);
      
      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });
  
  app.use('/api', router);
}
