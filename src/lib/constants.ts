import type { TaskPriority, TaskStatus } from "@/lib/types";

export type FilterStatus = "all" | TaskStatus;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
};

export const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: STATUS_LABELS.pending },
  { key: "in_progress", label: STATUS_LABELS.in_progress },
  { key: "completed", label: STATUS_LABELS.completed },
];

export const STAT_CARDS: { key: FilterStatus; label: string; color: string }[] = [
  { key: "all", label: "Total", color: "bg-slate-100 text-slate-900" },
  { key: "pending", label: STATUS_LABELS.pending, color: "bg-amber-50 text-amber-700" },
  {
    key: "in_progress",
    label: STATUS_LABELS.in_progress,
    color: "bg-blue-50 text-blue-700",
  },
  {
    key: "completed",
    label: STATUS_LABELS.completed,
    color: "bg-green-50 text-green-700",
  },
];
