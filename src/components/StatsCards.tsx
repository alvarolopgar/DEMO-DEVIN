"use client";

import { STAT_CARDS, type FilterStatus } from "@/lib/constants";

interface StatsCardsProps {
  counts: Record<FilterStatus, number>;
}

export default function StatsCards({ counts }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {STAT_CARDS.map((stat) => (
        <div
          key={stat.key}
          className={`${stat.color} rounded-xl p-4 text-center`}
        >
          <div className="text-2xl font-bold">{counts[stat.key]}</div>
          <div className="text-sm font-medium opacity-80">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
