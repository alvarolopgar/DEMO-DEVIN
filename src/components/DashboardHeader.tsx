"use client";

import Image from "next/image";
import type { User } from "@supabase/supabase-js";

interface DashboardHeaderProps {
  user: User | null;
  onSignOut: () => void;
}

export default function DashboardHeader({
  user,
  onSignOut,
}: DashboardHeaderProps) {
  return (
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
            onClick={onSignOut}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
