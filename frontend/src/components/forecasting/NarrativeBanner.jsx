import React from "react";

export default function NarrativeBanner({ icon, headline, bullets }) {
  return (
    <div className="flex gap-4 items-start bg-[var(--primary-teal-light)] border border-[var(--primary-teal)]/20 rounded-xl p-5 mb-5">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--primary-teal)]/10 flex items-center justify-center text-[var(--primary-teal)]">
        {icon || (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )}
      </div>
      <div>
        <div className="text-sm font-bold text-[var(--text-primary)]">
          {headline || "Loading..."}
        </div>
        {bullets && bullets.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            {bullets.map((b, i) => (
              <span key={i} className="text-xs text-[var(--text-secondary)]">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
