"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthMe, logout } from "@/lib/auth";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [welcomeName, setWelcomeName] = useState("회원");

  useEffect(() => {
    const loadAuth = async () => {
      const me = await fetchAuthMe();
      setLoggedIn(me.loggedIn);
      setWelcomeName(me.name ?? "회원");
      setMounted(true);
    };

    void loadAuth();
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
    <div className="selection:bg-[#F9EBE6]">
      <div className="relative overflow-hidden bg-theme-brand px-6 py-2.5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 text-[13px] font-medium tracking-wide">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">eco</span>
            <span className="serif-font italic">Autumn Vintage:</span>
            <span>모바일청첩장 1+1 깊어가는 가을의 약속</span>
          </div>
          <button className="absolute right-6 text-[10px] opacity-60 transition-opacity hover:opacity-100" type="button">
            7일 동안 보지 않기 ✕
          </button>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-warm bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-14">
            <div className="serif-font text-2xl font-semibold tracking-tight text-theme-brand">Wedding Letter</div>
            <nav className="hidden items-center gap-10 text-[14px] font-medium text-theme-secondary lg:flex">
              <button className="transition-colors hover:text-[var(--theme-brand)]" type="button" onClick={goToEditorWithGuard}>
                모바일 청첩장
              </button>
              <a className="transition-colors hover:text-[var(--theme-brand)]" href="#">
                고객후기
              </a>
                <a className="transition-colors hover:text-[var(--theme-brand)]" href="#">
                    공지사항
                </a>
              <a className="flex items-center gap-1 text-theme-accent" href="#">
                이벤트 <span className="material-symbols-outlined text-xs">forest</span>
              </a>
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

      <main>
        <section className="overflow-hidden bg-white py-32">
          <div className="mb-20 space-y-6 px-6 text-center">
            <p className="serif-font text-lg tracking-[0.2em] text-theme-accent italic">The Most Beautiful Beginning</p>
            <h1 className="serif-font text-5xl leading-[1.2] font-light text-theme-brand md:text-6xl">
              5만 신부가 선택한 이유,
              <br />
              완성도가 다르니까.
            </h1>
          </div>

          <div className="relative px-4 pb-20">
            <div className="hide-scrollbar flex items-center justify-center gap-6 overflow-x-auto md:gap-10">
              <div className="h-[290px] w-48 shrink-0 overflow-hidden rounded-2xl border border-warm bg-theme opacity-30 md:h-[360px] md:w-64">
                <img
                  className="h-full w-full object-cover opacity-50 grayscale"
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80"
                  alt="template-side-1"
                />
              </div>
              <div className="h-[310px] w-52 shrink-0 overflow-hidden rounded-2xl border border-warm bg-theme opacity-70 md:h-[390px] md:w-[272px]">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80"
                  alt="template-side-2"
                />
              </div>
              <div className="relative z-20 h-[340px] w-60 shrink-0 overflow-hidden rounded-3xl border border-[var(--theme-accent)] bg-white shadow-[0_30px_60px_-12px_rgba(128,59,42,0.15)] md:h-[430px] md:w-80">
                <img
                  className="h-full w-full object-cover opacity-90"
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80"
                  alt="template-main"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute right-0 bottom-10 left-0 space-y-3 px-8 text-center text-white">
                  <p className="serif-font text-xs tracking-[0.3em] italic">Autumn Vintage Template</p>
                  <div className="mx-auto h-px w-8 bg-white/40" />
                  <h4 className="serif-font text-2xl font-light">Burnt Orange</h4>
                </div>
              </div>
              <div className="h-[310px] w-52 shrink-0 overflow-hidden rounded-2xl border border-warm bg-theme opacity-70 md:h-[390px] md:w-[272px]">
                <img
                  className="h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80"
                  alt="template-side-3"
                />
              </div>
              <div className="h-[290px] w-48 shrink-0 overflow-hidden rounded-2xl border border-warm bg-theme opacity-30 md:h-[360px] md:w-64">
                <img
                  className="h-full w-full object-cover opacity-50 grayscale"
                  src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80"
                  alt="template-side-4"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-5">
            <button
              className="rounded-full bg-theme-brand px-14 py-5 text-lg font-bold text-white shadow-2xl shadow-orange-100 transition-transform hover:scale-[1.02]"
              type="button"
              onClick={goToEditorWithGuard}
            >
              청첩장 제작하기
            </button>
            <button
              className="rounded-full border border-warm px-14 py-5 text-lg font-medium transition-colors hover:bg-[var(--theme-bg)]"
              type="button"
              onClick={goToEditorWithGuard}
            >
              모바일 청첩장
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
