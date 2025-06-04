"use client";

import type { Task } from '@/types';

interface InteractiveTableClientProps {
  initialData: Task[];
}

export function InteractiveTableClient({ initialData }: InteractiveTableClientProps) {
  return (
    <div className="w-full text-center py-10">
      Interactive table placeholder ({initialData.length} tasks).
    </div>
  );
}
