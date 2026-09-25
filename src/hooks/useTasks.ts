"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/lib/services/tasks";
import type { Task, TaskInsert, TaskUpdate } from "@/lib/types";

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await fetchTasks(createClient());
    if (error) {
      setError("Could not load your tasks. Please try again.");
      return;
    }
    setError(null);
    setTasks(data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  }, [refresh]);

  const addTask = useCallback(
    async (taskData: TaskInsert) => {
      if (!userId) return;
      const { error } = await createTask(createClient(), taskData, userId);
      if (error) {
        setError("Could not create the task. Please try again.");
        return;
      }
      setError(null);
      await refresh();
    },
    [userId, refresh]
  );

  const editTask = useCallback(
    async (id: string, changes: TaskUpdate) => {
      const { data, error } = await updateTask(createClient(), id, changes);
      if (error) {
        setError("Could not update the task. Please try again.");
        return;
      }
      setError(null);
      if (data) {
        setTasks((current) =>
          current.map((task) => (task.id === id ? data : task))
        );
      } else {
        await refresh();
      }
    },
    [refresh]
  );

  const removeTask = useCallback(
    async (id: string) => {
      const { error } = await deleteTask(createClient(), id);
      if (error) {
        setError("Could not delete the task. Please try again.");
        return;
      }
      setError(null);
      setTasks((current) => current.filter((task) => task.id !== id));
    },
    []
  );

  const toggleStatus = useCallback(
    async (task: Task) => {
      const status = task.status === "completed" ? "pending" : "completed";
      await editTask(task.id, { status });
    },
    [editTask]
  );

  return {
    tasks,
    loading,
    error,
    setError,
    load,
    refresh,
    addTask,
    editTask,
    removeTask,
    toggleStatus,
  };
}
