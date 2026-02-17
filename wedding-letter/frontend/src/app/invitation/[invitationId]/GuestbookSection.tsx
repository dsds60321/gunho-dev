"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch, getApiErrorMessage } from "@/lib/api";

type GuestbookSectionProps = {
  invitationId: string;
  slug: string;
  enabled: boolean;
  preview?: boolean;
  embedded?: boolean;
};

type GuestbookEntry = {
  id: number;
  name: string;
  content: string;
  createdAt: string;
};

function formatGuestbookDate(rawDate: string): string {
  if (!rawDate) return "";
  const normalized = rawDate.includes("T") ? rawDate : rawDate.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate.replace("T", " ").slice(0, 19);
  }
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  const hour = `${parsed.getHours()}`.padStart(2, "0");
  const minute = `${parsed.getMinutes()}`.padStart(2, "0");
  const second = `${parsed.getSeconds()}`.padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
}

export default function GuestbookSection({ invitationId, slug, enabled, preview = false, embedded = false }: GuestbookSectionProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", password: "", content: "" });

  const loadEntries = useCallback(async () => {
    if (!enabled) return;
    const endpoint = preview
      ? `/api/invitations/${encodeURIComponent(invitationId)}/guestbook`
      : `/api/public/invitations/${encodeURIComponent(slug)}/guestbook`;
    setLoading(true);
    try {
      const result = await apiFetch<GuestbookEntry[]>(endpoint, { cache: "no-store" });
      setEntries(result);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "방명록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }, [enabled, invitationId, preview, slug]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  if (!enabled) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const password = form.password.trim();
    const content = form.content.trim();
    if (!name || !password || !content) {
      setMessage("이름, 비밀번호, 내용을 모두 입력해 주세요.");
      return;
    }

    const endpoint = preview
      ? `/api/invitations/${encodeURIComponent(invitationId)}/guestbook`
      : `/api/public/invitations/${encodeURIComponent(slug)}/guestbook`;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch<unknown>(endpoint, {
        method: "POST",
        body: JSON.stringify({ name, password, content }),
      });
      setForm({ name: "", password: "", content: "" });
      setMessage("방명록이 등록되었습니다.");
      await loadEntries();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "방명록 등록에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="py-12 px-8 bg-theme border-t border-warm">
        <div className="text-center mb-8">
          <p className="serif-font text-xs tracking-widest text-theme-accent italic uppercase">Guestbook</p>
          <h3 className="mt-2 serif-kr text-lg font-semibold text-theme-brand">축하의 한마디</h3>
        </div>

        <button
          type="button"
          className="w-full rounded-xl border border-theme-brand bg-white py-3 text-xs font-bold text-theme-brand transition-colors hover:bg-theme"
          onClick={() => setIsModalOpen(true)}
        >
          방명록 작성하기
        </button>

        <div className="space-y-4 mt-4">
          {loading ? <p className="text-center text-xs text-theme-secondary">방명록 불러오는 중...</p> : null}
          {!loading && entries.length === 0 ? (
            <div className="rounded-xl border border-warm bg-white p-4 text-center text-sm text-theme-secondary">
              첫 번째 축하 메시지를 남겨보세요.
            </div>
          ) : null}
          {entries.slice(0, 3).map((entry) => (
            <div className="rounded-xl border border-warm bg-white p-4 shadow-sm" key={`guestbook-${entry.id}`}>
              <p className="text-xs font-bold text-theme-brand">
                {entry.name}
                <span className="ml-2 font-normal text-theme-secondary opacity-70">{formatGuestbookDate(entry.createdAt)}</span>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-theme-secondary">{entry.content}</p>
            </div>
          ))}
          {entries.length > 3 ? (
            <button
              type="button"
              className="w-full rounded-xl border border-warm bg-white py-3 text-xs font-bold text-theme-secondary"
              onClick={() => setIsModalOpen(true)}
            >
              방명록 더보기
            </button>
          ) : null}
        </div>
      </section>

      {isModalOpen ? (
        <div
          className={
            embedded
              ? "absolute inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              : "fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          }
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-warm px-8 py-5">
              <h3 className="text-lg font-bold text-theme-brand">방명록 작성</h3>
              <button type="button" className="text-theme-secondary hover:text-theme-brand" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto bg-[#fdfcfb] px-8 py-6">
              <form className="space-y-4 rounded-2xl border border-warm bg-white p-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">이름</span>
                    <input
                      className="input-premium"
                      value={form.name}
                      maxLength={30}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="작성자 이름"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">비밀번호</span>
                    <input
                      className="input-premium"
                      type="password"
                      value={form.password}
                      maxLength={30}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="삭제/수정용 비밀번호"
                    />
                  </label>
                </div>
                <label className="space-y-2 block">
                  <span className="text-xs font-bold text-theme-secondary">내용</span>
                  <textarea
                    className="input-premium min-h-28"
                    value={form.content}
                    maxLength={1000}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="축하 메시지를 남겨주세요."
                  />
                </label>
                {message ? <p className="rounded-lg bg-theme px-3 py-2 text-xs text-theme-secondary">{message}</p> : null}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme"
                    onClick={() => setIsModalOpen(false)}
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-theme-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                    disabled={saving}
                  >
                    {saving ? "등록중..." : "등록하기"}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <p className="text-xs font-bold text-theme-secondary">등록된 방명록</p>
                {loading ? <p className="text-xs text-theme-secondary">불러오는 중...</p> : null}
                {!loading && entries.length === 0 ? (
                  <div className="rounded-xl border border-warm bg-white p-4 text-xs text-theme-secondary">등록된 방명록이 없습니다.</div>
                ) : null}
                {!loading && entries.length > 0 ? (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div className="rounded-xl border border-warm bg-white p-3" key={`modal-guestbook-${entry.id}`}>
                        <p className="text-xs font-bold text-theme-brand">
                          {entry.name}
                          <span className="ml-2 font-normal text-theme-secondary opacity-70">{formatGuestbookDate(entry.createdAt)}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-theme-secondary">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
