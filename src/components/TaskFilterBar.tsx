"use client";

import { STATUS_FILTERS, type FilterStatus } from "@/lib/constants";

interface TaskFilterBarProps {
  value: FilterStatus;
  onChange: (status: FilterStatus) => void;
}

export default function TaskFilterBar({ value, onChange }: TaskFilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onChange(filter.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            value === filter.key
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
