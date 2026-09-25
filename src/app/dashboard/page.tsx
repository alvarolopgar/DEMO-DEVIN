"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import DashboardHeader from "@/components/DashboardHeader";
import ErrorMessage from "@/components/ErrorMessage";
import StatsCards from "@/components/StatsCards";
import TaskFilterBar from "@/components/TaskFilterBar";
import TaskList from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import TaskSearchBar from "@/components/TaskSearchBar";
import { useTasks } from "@/hooks/useTasks";
import { createClient } from "@/lib/supabase/client";
import type { FilterStatus } from "@/lib/constants";
import type { Task, TaskInsert } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const {
    tasks,
    loading,
    error,
    setError,
    load,
    addTask,
    editTask,
    removeTask,
    toggleStatus,
  } = useTasks(user?.id);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setCheckingAuth(false);
      await load();
    };
    init();
  }, [router, load]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus =
        filterStatus === "all" || task.status === filterStatus;
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query) ?? false);
      return matchesStatus && matchesSearch;
    });
  }, [tasks, filterStatus, searchQuery]);

  const taskCounts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks]
  );

  const openCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleSave = async (taskData: TaskInsert) => {
    if (editingTask) {
      await editTask(editingTask.id, taskData);
      setEditingTask(null);
      return;
    }
    await addTask(taskData);
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} onSignOut={handleSignOut} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <StatsCards counts={taskCounts} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TaskFilterBar value={filterStatus} onChange={setFilterStatus} />
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <TaskSearchBar value={searchQuery} onChange={setSearchQuery} />
            <button
              onClick={openCreateModal}
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

        <TaskList
          tasks={filteredTasks}
          isFiltered={Boolean(searchQuery) || filterStatus !== "all"}
          onCreate={openCreateModal}
          onEdit={(task) => {
            setEditingTask(task);
            setModalOpen(true);
          }}
          onDelete={removeTask}
          onToggleStatus={toggleStatus}
        />
      </main>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        task={editingTask}
      />
    </div>
  );
}
