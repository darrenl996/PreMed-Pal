import { 
  User, InsertUser, 
  Course, InsertCourse, 
  Material, InsertMaterial, 
  StudyPlan, InsertStudyPlan,
  users, courses, materials, studyPlans
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByUserId(userId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Material operations
  getMaterial(id: number): Promise<Material | undefined>;
  getMaterialsByCourseId(courseId: number): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Study plan operations
  getStudyPlan(id: number): Promise<StudyPlan | undefined>;
  getStudyPlansByCourseId(courseId: number): Promise<StudyPlan[]>;
  getStudyPlansByUserId(userId: number): Promise<StudyPlan[]>;
  createStudyPlan(studyPlan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: number, studyPlan: Partial<StudyPlan>): Promise<StudyPlan | undefined>;
  deleteStudyPlan(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

// Database implementation for storage
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByUserId(userId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.userId, userId));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values({
      ...insertCourse,
      description: insertCourse.description ?? null
    }).returning();
    return course;
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(courses.id, id))
      .returning();
    
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const [deletedCourse] = await db.delete(courses)
      .where(eq(courses.id, id))
      .returning();
      
    return !!deletedCourse;
  }

  // Material operations
  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async getMaterialsByCourseId(courseId: number): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(insertMaterial).returning();
    return material;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const [deletedMaterial] = await db.delete(materials)
      .where(eq(materials.id, id))
      .returning();
      
    return !!deletedMaterial;
  }

  // Study plan operations
  async getStudyPlan(id: number): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.id, id));
    return plan;
  }

  async getStudyPlansByCourseId(courseId: number): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.courseId, courseId));
  }
  
  async getStudyPlansByUserId(userId: number): Promise<StudyPlan[]> {
    // First get all courses for this user
    const userCourses = await this.getCoursesByUserId(userId);
    const courseIds = userCourses.map(course => course.id);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    // Get all study plans for those courses
    return await db.select().from(studyPlans).where(inArray(studyPlans.courseId, courseIds));
  }

  async createStudyPlan(insertStudyPlan: InsertStudyPlan): Promise<StudyPlan> {
    const [studyPlan] = await db.insert(studyPlans).values({
      ...insertStudyPlan,
      isActive: insertStudyPlan.isActive ?? true
    }).returning();
    
    return studyPlan;
  }

  async updateStudyPlan(id: number, updates: Partial<StudyPlan>): Promise<StudyPlan | undefined> {
    const [updatedPlan] = await db.update(studyPlans)
      .set(updates)
      .where(eq(studyPlans.id, id))
      .returning();
      
    return updatedPlan;
  }

  async deleteStudyPlan(id: number): Promise<boolean> {
    const [deletedPlan] = await db.delete(studyPlans)
      .where(eq(studyPlans.id, id))
      .returning();
      
    return !!deletedPlan;
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private materials: Map<number, Material>;
  private studyPlans: Map<number, StudyPlan>;
  
  sessionStore: any;
  private userIdCounter: number;
  private courseIdCounter: number;
  private materialIdCounter: number;
  private studyPlanIdCounter: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.materials = new Map();
    this.studyPlans = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.materialIdCounter = 1;
    this.studyPlanIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByUserId(userId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.userId === userId,
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const now = new Date();
    const course: Course = { 
      ...insertCourse, 
      id, 
      description: insertCourse.description ?? null, // Ensure description is never undefined
      createdAt: now, 
      updatedAt: now 
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { 
      ...course, 
      ...updates,
      updatedAt: new Date() 
    };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Material operations
  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async getMaterialsByCourseId(courseId: number): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(
      (material) => material.courseId === courseId,
    );
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.materialIdCounter++;
    const now = new Date();
    const material: Material = { 
      ...insertMaterial, 
      id, 
      uploadedAt: now
    };
    this.materials.set(id, material);
    return material;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.materials.delete(id);
  }

  // Study plan operations
  async getStudyPlan(id: number): Promise<StudyPlan | undefined> {
    return this.studyPlans.get(id);
  }

  async getStudyPlansByCourseId(courseId: number): Promise<StudyPlan[]> {
    return Array.from(this.studyPlans.values()).filter(
      (plan) => plan.courseId === courseId,
    );
  }
  
  async getStudyPlansByUserId(userId: number): Promise<StudyPlan[]> {
    // Get all courses for the user
    const userCourses = await this.getCoursesByUserId(userId);
    const courseIds = userCourses.map(course => course.id);
    
    // Return study plans for those courses
    return Array.from(this.studyPlans.values()).filter(
      (plan) => courseIds.includes(plan.courseId),
    );
  }

  async createStudyPlan(insertStudyPlan: InsertStudyPlan): Promise<StudyPlan> {
    const id = this.studyPlanIdCounter++;
    const now = new Date();
    const studyPlan: StudyPlan = { 
      ...insertStudyPlan, 
      id, 
      isActive: insertStudyPlan.isActive ?? true, // Ensure isActive is never undefined
      generatedAt: now
    };
    this.studyPlans.set(id, studyPlan);
    return studyPlan;
  }

  async updateStudyPlan(id: number, updates: Partial<StudyPlan>): Promise<StudyPlan | undefined> {
    const studyPlan = this.studyPlans.get(id);
    if (!studyPlan) return undefined;
    
    const updatedStudyPlan = { 
      ...studyPlan, 
      ...updates,
    };
    this.studyPlans.set(id, updatedStudyPlan);
    return updatedStudyPlan;
  }

  async deleteStudyPlan(id: number): Promise<boolean> {
    return this.studyPlans.delete(id);
  }
}

// Switch from in-memory storage to database storage
export const storage = new DatabaseStorage();
