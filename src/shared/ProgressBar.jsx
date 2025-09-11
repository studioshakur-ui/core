import React from "react";
export default function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500" style={{ width: v + "%" }} />
    </div>
  );
}
