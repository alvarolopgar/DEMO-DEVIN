"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskInsert, TaskUpdate } from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

type FilterStatus = "all" | "pending" | "in_progress" | "completed";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }
    setTasks((data as Task[]) || []);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      await fetchTasks();
      setLoading(false);
    };
    init();
  }, [supabase, router, fetchTasks]);

  const handleCreateTask = async (taskData: TaskInsert) => {
    const { error } = await supabase.from("tasks").insert({
      ...taskData,
      user_id: user?.id,
    });
    if (error) {
      console.error("Error creating task:", error);
      return;
    }
    await fetchTasks();
  };

  const handleUpdateTask = async (taskData: TaskUpdate) => {
    if (!editingTask) return;
    const { error } = await supabase
      .from("tasks")
      .update(taskData)
      .eq("id", editingTask.id);
    if (error) {
      console.error("Error updating task:", error);
      return;
    }
    setEditingTask(null);
    await fetchTasks();
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Error deleting task:", error);
      return;
    }
    await fetchTasks();
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);
    if (error) {
      console.error("Error toggling task:", error);
      return;
    }
    await fetchTasks();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);
    return matchesStatus && matchesSearch;
  });

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Task Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.user_metadata?.avatar_url && (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                  unoptimized
                />
              )}
              <span className="text-sm text-slate-600 hidden sm:inline">
                {user?.user_metadata?.full_name || user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {(
            [
              {
                label: "Total",
                count: taskCounts.all,
                color: "bg-slate-100 text-slate-900",
              },
              {
                label: "Pending",
                count: taskCounts.pending,
                color: "bg-amber-50 text-amber-700",
              },
              {
                label: "In Progress",
                count: taskCounts.in_progress,
                color: "bg-blue-50 text-blue-700",
              },
              {
                label: "Completed",
                count: taskCounts.completed,
                color: "bg-green-50 text-green-700",
              },
            ] as const
          ).map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-xl p-4 text-center`}
            >
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="text-sm font-medium opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "in_progress", label: "In Progress" },
                { key: "completed", label: "Completed" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  filterStatus === filter.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              No tasks found
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Create your first task to get started"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => {
                  setEditingTask(t);
                  setModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
      />
    </div>
  );
}
