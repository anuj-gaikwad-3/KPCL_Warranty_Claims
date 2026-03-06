import React from "react";

export default function SupportingPlots({ category, curatedPlots, openLightbox }) {
  if (!curatedPlots || !curatedPlots[category]) return null;
  const cat = curatedPlots[category];
  const supp = cat.plots.filter((p) => p.role === "supporting");
  if (!supp.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {supp.map((p, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openLightbox(p.url, p.label)}
        >
          <div className="relative">
            <img
              className="w-full h-40 object-cover"
              src={p.url}
              alt={p.label}
              loading="lazy"
            />
            <div className="absolute top-2 right-2 bg-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-full text-[var(--primary-teal)]">
              Analysis
            </div>
          </div>
          <div className="p-3">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {p.label}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
              {p.description}
            </div>
            <div className="text-[11px] text-[var(--primary-teal)] mt-2 font-medium">
              Click to expand
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
