"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
  const [isImageFullscreenOpen, setIsImageFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const resolvedIndex = safeImages.length === 0 ? 0 : Math.min(activeIndex, safeImages.length - 1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (galleryMode === "grid" || safeImages.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, autoSlideMs);
    return () => window.clearInterval(timer);
  }, [autoSlideMs, galleryMode, safeImages.length]);

  useEffect(() => {
    if (safeImages.length === 0) {
      setIsViewMoreOpen(false);
      setIsImageFullscreenOpen(false);
      setFullscreenIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, safeImages.length - 1));
    setFullscreenIndex((prev) => Math.min(prev, safeImages.length - 1));
  }, [safeImages.length]);

  if (safeImages.length === 0) return null;

  const movePrev = () => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };
  const moveNext = () => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };
  const openImageFullscreen = (index: number) => {
    if (!Number.isFinite(index)) return;
    const normalized = Math.max(0, Math.min(index, safeImages.length - 1));
    setFullscreenIndex(normalized);
    setIsImageFullscreenOpen(true);
  };
  const moveFullscreenPrev = () => {
    setFullscreenIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };
  const moveFullscreenNext = () => {
    setFullscreenIndex((prev) => (prev + 1) % safeImages.length);
  };
  const openViewMore = () => setIsViewMoreOpen(true);
  const closeViewMore = () => setIsViewMoreOpen(false);
  const closeImageFullscreen = () => setIsImageFullscreenOpen(false);

  const viewMoreModal =
    mounted && isViewMoreOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="갤러리 전체 보기"
            onClick={closeViewMore}
          >
            <div className="w-full max-w-[720px] rounded-3xl bg-white p-5 md:p-6" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-theme-brand">전체 갤러리</p>
                <button className="rounded-full p-1 text-theme-secondary transition-colors hover:bg-theme hover:text-theme-brand" type="button" onClick={closeViewMore}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="grid max-h-[70vh] grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
                {safeImages.map((url, index) => (
                  <button
                    key={`${url}-full-${index}`}
                    type="button"
                    className="overflow-hidden rounded-lg"
                    onClick={() => {
                      closeViewMore();
                      openImageFullscreen(index);
                    }}
                  >
                    <img className="aspect-square w-full object-cover transition-transform duration-200 hover:scale-[1.03]" src={url} alt={`gallery-full-${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const fullscreenModal =
    mounted && isImageFullscreenOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="사진 상세 보기"
            onClick={closeImageFullscreen}
          >
            <div className="relative flex h-full w-full max-w-[980px] items-center justify-center" onClick={(event) => event.stopPropagation()}>
              <button
                className="absolute right-0 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold text-theme-secondary shadow transition-colors hover:bg-white"
                type="button"
                onClick={closeImageFullscreen}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span>닫기</span>
              </button>

              {safeImages.length > 1 ? (
                <>
                  <button
                    className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/86 text-black shadow transition-colors hover:bg-white"
                    type="button"
                    onClick={moveFullscreenPrev}
                  >
                    <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                  </button>
                  <button
                    className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/86 text-black shadow transition-colors hover:bg-white"
                    type="button"
                    onClick={moveFullscreenNext}
                  >
                    <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                  </button>
                </>
              ) : null}

              <img className="max-h-[88vh] w-auto max-w-[92vw] rounded-2xl object-contain shadow-2xl" src={safeImages[fullscreenIndex]} alt={`gallery-preview-${fullscreenIndex + 1}`} />
            </div>
          </div>,
          document.body,
        )
      : null;

  if (galleryMode === "grid") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {safeImages.slice(0, 4).map((url, index) => (
            <button key={`${url}-${index}`} type="button" className="overflow-hidden rounded-xl" onClick={() => openImageFullscreen(index)}>
              <img className="aspect-square w-full rounded-xl object-cover transition-transform duration-200 hover:scale-[1.03]" src={url} alt={`gallery-${index + 1}`} />
            </button>
          ))}
        </div>
        {safeImages.length > 4 ? (
          <button
            type="button"
            className="mx-auto flex items-center gap-1 rounded-full border border-warm bg-white px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme"
            onClick={openViewMore}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>View More</span>
          </button>
        ) : null}
        {viewMoreModal}
        {fullscreenModal}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-stone-100">
        <button type="button" className="block w-full" onClick={() => openImageFullscreen(resolvedIndex)}>
          <img className="aspect-[4/3] w-full object-cover" src={safeImages[resolvedIndex]} alt={`gallery-main-${resolvedIndex + 1}`} />
        </button>
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
          onClick={openViewMore}
        >
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          <span>View More</span>
        </button>
      ) : null}

      {viewMoreModal}
      {fullscreenModal}
    </div>
  );
}
