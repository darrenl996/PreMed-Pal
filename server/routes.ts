import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUploadRoutes } from "./file-upload";
import { insertCourseSchema, insertStudyPlanSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup file upload routes
  setupFileUploadRoutes(app);
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "You must be logged in" });
  };

  // Course routes
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const courses = await storage.getCoursesByUserId(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });
  
  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this course" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });
  
  app.post("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      
      const validatedData = insertCourseSchema.parse({
        ...req.body,
        userId
      });
      
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });
  
  app.put("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      // Check if course exists and belongs to user
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this course" });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });
  
  app.delete("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      // Check if course exists and belongs to user
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this course" });
      }
      
      // The updated deleteCourse method handles cascading deletes in a transaction
      const success = await storage.deleteCourse(courseId);
      
      if (success) {
        res.json({ message: "Course deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete course" });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });
  
  // Study plan routes
  app.get("/api/study-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const studyPlans = await storage.getStudyPlansByUserId(userId);
      res.json(studyPlans);
    } catch (error) {
      console.error("Error fetching study plans:", error);
      res.status(500).json({ message: "Failed to fetch study plans" });
    }
  });
  
  app.get("/api/courses/:courseId/study-plans", isAuthenticated, async (req, res) => {
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
      
      const studyPlans = await storage.getStudyPlansByCourseId(courseId);
      res.json(studyPlans);
    } catch (error) {
      console.error("Error fetching study plans:", error);
      res.status(500).json({ message: "Failed to fetch study plans" });
    }
  });
  
  app.get("/api/study-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      const studyPlan = await storage.getStudyPlan(planId);
      if (!studyPlan) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      
      // Check if study plan's course belongs to user
      const course = await storage.getCourse(studyPlan.courseId);
      if (!course || course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this study plan" });
      }
      
      res.json(studyPlan);
    } catch (error) {
      console.error("Error fetching study plan:", error);
      res.status(500).json({ message: "Failed to fetch study plan" });
    }
  });
  
  app.post("/api/study-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Check if course belongs to user
      const course = await storage.getCourse(req.body.courseId);
      if (!course || course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to create a study plan for this course" });
      }
      
      const validatedData = insertStudyPlanSchema.parse(req.body);
      const studyPlan = await storage.createStudyPlan(validatedData);
      
      res.status(201).json(studyPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      console.error("Error creating study plan:", error);
      res.status(500).json({ message: "Failed to create study plan" });
    }
  });
  
  app.put("/api/study-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      const studyPlan = await storage.getStudyPlan(planId);
      if (!studyPlan) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      
      // Check if study plan's course belongs to user
      const course = await storage.getCourse(studyPlan.courseId);
      if (!course || course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this study plan" });
      }
      
      const updatedPlan = await storage.updateStudyPlan(planId, req.body);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating study plan:", error);
      res.status(500).json({ message: "Failed to update study plan" });
    }
  });
  
  app.delete("/api/study-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      const studyPlan = await storage.getStudyPlan(planId);
      if (!studyPlan) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      
      // Check if study plan's course belongs to user
      const course = await storage.getCourse(studyPlan.courseId);
      if (!course || course.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this study plan" });
      }
      
      await storage.deleteStudyPlan(planId);
      res.json({ message: "Study plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting study plan:", error);
      res.status(500).json({ message: "Failed to delete study plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
