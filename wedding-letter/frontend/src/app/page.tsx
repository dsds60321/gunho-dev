"use client";

import { useRouter } from "next/navigation";
import { fetchAuthMe } from "@/lib/auth";
import LandingTopHeader from "@/components/LandingTopHeader";

export default function LandingPage() {
  const router = useRouter();

  const goToEditorWithGuard = () => {
    void (async () => {
      const me = await fetchAuthMe();
      if (me.loggedIn) {
        router.push("/editor");
        return;
      }
      router.push("/login");
    })();
  };

  return (
    <div className="selection:bg-[#F9EBE6]">
      <LandingTopHeader />

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
