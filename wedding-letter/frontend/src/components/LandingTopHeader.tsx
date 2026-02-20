"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { fetchAuthMe, logout } from "@/lib/auth";
import type { NoticeSummary } from "@/types/notice";

export default function LandingTopHeader() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [welcomeName, setWelcomeName] = useState("회원");
  const [bannerNotices, setBannerNotices] = useState<NoticeSummary[]>([]);

  useEffect(() => {
    const loadAuth = async () => {
      const me = await fetchAuthMe();
      setLoggedIn(me.loggedIn);
      setWelcomeName(me.name ?? "회원");
      setMounted(true);
    };

    void loadAuth();
  }, []);

  useEffect(() => {
    const loadBannerNotices = async () => {
      try {
        const data = await apiFetch<NoticeSummary[]>("/api/public/notices/banner", {
          cache: "no-store",
        });
        setBannerNotices(data);
      } catch {
        setBannerNotices([]);
      }
    };

    void loadBannerNotices();
  }, []);

  const goToEditorWithGuard = () => {
    if (!mounted) return;
    if (loggedIn) {
      router.push("/editor");
      return;
    }
    router.push("/login");
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setWelcomeName("회원");
    router.refresh();
  };

  return (
    <>
      {bannerNotices.length > 0 ? (
        <div className="relative overflow-hidden bg-theme-brand px-6 py-2.5 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 text-[13px] font-medium tracking-wide">
            <div className="flex items-center gap-2">
              <button
                className="max-w-[340px] truncate text-left underline-offset-2 hover:underline"
                type="button"
                onClick={() => router.push(`/notices/${bannerNotices[0].id}`)}
              >
                {bannerNotices[0].title}
              </button>
            </div>
            <button className="absolute right-6 text-[10px] opacity-60 transition-opacity hover:opacity-100" type="button">
              7일 동안 보지 않기 ✕
            </button>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-warm bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-14">
            <div className="serif-font text-2xl font-semibold tracking-tight text-theme-brand">Wedding Letter</div>
            <nav className="hidden items-center gap-10 text-[14px] font-medium text-theme-secondary lg:flex">
              <button className="transition-colors hover:text-[var(--theme-brand)]" type="button" onClick={goToEditorWithGuard}>
                모바일 청첩장
              </button>
              {/*<a className="transition-colors hover:text-[var(--theme-brand)]" href="#">*/}
              {/*  고객후기*/}
              {/*</a>*/}
              <a className="transition-colors hover:text-[var(--theme-brand)]" href="/notices">
                공지사항
              </a>
              {/*<a className="flex items-center gap-1 text-theme-accent" href="#">*/}
              {/*  이벤트 <span className="material-symbols-outlined text-xs">forest</span>*/}
              {/*</a>*/}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!mounted ? <div className="h-9 w-24 rounded-full border border-warm" /> : null}

            {mounted && !loggedIn ? (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-warm bg-theme text-theme-secondary transition-colors hover:text-[var(--theme-brand)]"
                type="button"
                onClick={() => router.push("/login")}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
              </button>
            ) : null}

            {mounted && loggedIn ? (
              <>
                <span className="hidden text-sm font-medium text-theme-secondary md:block">{welcomeName}님 환영합니다</span>
                <button
                  className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-[var(--theme-bg)]"
                  type="button"
                  onClick={() => router.push("/mypage")}
                >
                  마이페이지
                </button>
                <button className="rounded-full bg-theme-brand px-4 py-2 text-xs font-bold text-white" type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
