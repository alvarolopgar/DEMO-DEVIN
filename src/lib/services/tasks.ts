import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { TaskInsert, TaskUpdate } from "@/lib/types";

type Client = SupabaseClient<Database>;

export async function fetchTasks(supabase: Client) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data ?? [], error };
}

export async function createTask(
  supabase: Client,
  task: TaskInsert,
  userId: string
) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...task, user_id: userId })
    .select()
    .single();

  return { data, error };
}

export async function updateTask(
  supabase: Client,
  id: string,
  changes: TaskUpdate
) {
  const { data, error } = await supabase
    .from("tasks")
    .update(changes)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteTask(supabase: Client, id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  return { data: null, error };
}
