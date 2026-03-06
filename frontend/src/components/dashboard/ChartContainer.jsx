import React from "react";

export default function ChartContainer({ children, className = "" }) {
  return (
    <div className={`chart-container ${className}`}>
      <div className="rounded-[10px] overflow-hidden">{children}</div>
    </div>
  );
}
