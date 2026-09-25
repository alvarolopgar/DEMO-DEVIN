import type { Database, TaskPriority, TaskStatus } from "@/lib/database.types";

export type { TaskPriority, TaskStatus };

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskInsert = Omit<Task, "id" | "user_id" | "created_at" | "updated_at">;
export type TaskUpdate = Partial<TaskInsert>;
