import React from "react";

export default function HeroPlot({ category, curatedPlots, openLightbox }) {
  if (!curatedPlots || !curatedPlots[category]) return null;
  const cat = curatedPlots[category];
  const hero = cat.plots.find((p) => p.role === "hero");
  if (!hero) return null;

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-shadow"
      onClick={() => openLightbox(hero.url, hero.label)}
    >
      <img
        className="w-full h-auto object-cover"
        src={hero.url}
        alt={hero.label}
        loading="lazy"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
        <div className="text-white font-semibold text-sm">{hero.label}</div>
        <div className="text-white/70 text-xs mt-1">{hero.description}</div>
        <div className="text-white/80 text-xs mt-2 flex items-center gap-1 group-hover:text-white transition-colors">
          <span>Click to expand</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </div>
      </div>
    </div>
  );
}
