export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, "id" | "user_id" | "created_at" | "updated_at">;
export type TaskUpdate = Partial<TaskInsert>;
