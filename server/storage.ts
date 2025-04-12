import { 
  User, InsertUser, 
  Course, InsertCourse, 
  Material, InsertMaterial, 
  StudyPlan, InsertStudyPlan 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: any; // Using 'any' as a workaround for the SessionStore type issue
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private materials: Map<number, Material>;
  private studyPlans: Map<number, StudyPlan>;
  
  sessionStore: any; // Using 'any' as a workaround for the SessionStore type issue
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

export const storage = new MemStorage();
