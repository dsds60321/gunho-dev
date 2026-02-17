"use client";

import { useEffect, useMemo, useState } from "react";

export type WeddingGalleryMode = "swipe" | "thumbnail-swipe" | "grid";

type WeddingGalleryProps = {
  images: string[];
  mode?: string | null;
  autoSlideMs?: number;
};

function normalizeGalleryMode(mode?: string | null): WeddingGalleryMode {
  if (mode === "thumbnail-swipe") return "thumbnail-swipe";
  if (mode === "grid") return "grid";
  return "swipe";
}

export default function WeddingGallery({ images, mode, autoSlideMs = 3200 }: WeddingGalleryProps) {
  const galleryMode = normalizeGalleryMode(mode);
  const safeImages = useMemo(() => images.filter((url) => url && url.trim().length > 0), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewMoreOpen, setIsViewMoreOpen] = useState(false);
  const resolvedIndex = safeImages.length === 0 ? 0 : Math.min(activeIndex, safeImages.length - 1);

  useEffect(() => {
    if (galleryMode === "grid" || safeImages.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, autoSlideMs);
    return () => window.clearInterval(timer);
  }, [autoSlideMs, galleryMode, safeImages.length]);

  if (safeImages.length === 0) return null;

  const movePrev = () => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };
  const moveNext = () => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };

  if (galleryMode === "grid") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {safeImages.slice(0, 4).map((url, index) => (
            <img className="aspect-square w-full rounded-xl object-cover" key={`${url}-${index}`} src={url} alt={`gallery-${index + 1}`} />
          ))}
        </div>
        {safeImages.length > 4 ? (
          <button
            type="button"
            className="mx-auto flex items-center gap-1 rounded-full border border-warm bg-white px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme"
            onClick={() => setIsViewMoreOpen(true)}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>View More</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-stone-100">
        <img className="aspect-[4/3] w-full object-cover" src={safeImages[resolvedIndex]} alt={`gallery-main-${resolvedIndex + 1}`} />
        {safeImages.length > 1 ? (
          <>
            <button
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
              type="button"
              onClick={movePrev}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
              type="button"
              onClick={moveNext}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </>
        ) : null}
      </div>

      {galleryMode === "thumbnail-swipe" ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((url, index) => (
            <button
              key={`${url}-thumb-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 overflow-hidden rounded border ${index === resolvedIndex ? "border-theme-brand" : "border-warm"}`}
            >
              <img className="h-14 w-14 object-cover" src={url} alt={`gallery-thumb-${index + 1}`} />
            </button>
          ))}
        </div>
      ) : null}

      {safeImages.length > 4 ? (
        <button
          type="button"
          className="mx-auto flex items-center gap-1 rounded-full border border-warm bg-white px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme"
          onClick={() => setIsViewMoreOpen(true)}
        >
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          <span>View More</span>
        </button>
      ) : null}

      {isViewMoreOpen ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-[680px] rounded-3xl bg-white p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-theme-brand">전체 갤러리</p>
              <button className="text-theme-secondary hover:text-theme-brand" type="button" onClick={() => setIsViewMoreOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid max-h-[70vh] grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
              {safeImages.map((url, index) => (
                <img className="aspect-square w-full rounded-lg object-cover" key={`${url}-full-${index}`} src={url} alt={`gallery-full-${index + 1}`} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
