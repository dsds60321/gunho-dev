"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { NoticeSummary } from "@/types/notice";

export default function NoticeBannerInline() {
  const router = useRouter();
  const [rows, setRows] = useState<NoticeSummary[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await apiFetch<NoticeSummary[]>("/api/public/notices/banner", {
          cache: "no-store",
        });
        setRows(data);
      } catch {
        setRows([]);
      }
    };

    void loadBanners();
  }, []);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-warm bg-white/90">
      <div className="mx-auto max-w-7xl px-8 py-4">
        <p className="text-xs font-bold tracking-[0.15em] text-theme-accent uppercase">공지 배너</p>
        <ul className="mt-3 space-y-2">
          {rows.map((notice) => (
            <li key={notice.id}>
              <button
                className="w-full rounded-xl border border-warm bg-theme px-4 py-3 text-left text-sm font-medium text-theme-brand transition-colors hover:bg-white"
                type="button"
                onClick={() => router.push(`/notices/${notice.id}`)}
              >
                {notice.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
