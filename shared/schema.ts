import { uuid, pgTable, text, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users schema
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
});

// Courses schema
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdFk: foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
  }),
}));

// Course materials schema
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => ({
  courseIdFk: foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
  }),
}));

// Study plans schema
export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  content: text("content").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  courseIdFk: foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
  }),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  user: one(users, {
    fields: [courses.userId],
    references: [users.id],
  }),
  materials: many(materials),
  studyPlans: many(studyPlans),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
  course: one(courses, {
    fields: [studyPlans.courseId],
    references: [courses.id],
  }),
}));

// Schema validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertCourseSchema = createInsertSchema(courses, {
  userId: z.string().uuid(), // ✅ override number → UUID string
}).pick({
  userId: true,
  name: true,
  description: true,
});

export const insertMaterialSchema = createInsertSchema(materials, {
  courseId: z.string().uuid(), // optional override if needed
}).pick({
  courseId: true,
  filename: true,
  originalName: true,
  path: true,
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans, {
  courseId: z.string().uuid(), // optional override if needed
}).pick({
  courseId: true,
  content: true,
  isActive: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
