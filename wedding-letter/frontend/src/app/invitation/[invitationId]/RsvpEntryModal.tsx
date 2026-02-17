"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, getApiErrorMessage } from "@/lib/api";

type RsvpEntryModalProps = {
  invitationId: string;
  slug: string;
  enabled: boolean;
  preview?: boolean;
  embedded?: boolean;
  weddingDateText: string;
  venueName: string;
  venueAddress: string;
  // 추가 필드
  rsvpTitle?: string;
  rsvpMessage?: string;
  rsvpButtonText?: string;
  rsvpFontFamily?: string;
};

type RsvpFormState = {
  name: string;
  attending: boolean;
  partyCount: number;
  meal: boolean;
  note: string;
};

const defaultForm: RsvpFormState = {
  name: "",
  attending: true,
  partyCount: 1,
  meal: false,
  note: "",
};

function todayKeyValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RsvpEntryModal({ 
  invitationId, 
  slug, 
  enabled, 
  preview = false,
  embedded = false,
  weddingDateText, 
  venueName, 
  venueAddress,
  rsvpTitle = "참석 의사 전달",
  rsvpMessage = "특별한 날 축하의 마음으로 참석해주시는 모든 분들을 위해\n아래 버튼으로 신랑 & 신부에게 꼭 참석여부 전달을 부탁드립니다.",
  rsvpButtonText = "참석의사 전달하기",
  rsvpFontFamily = "'Noto Sans KR', sans-serif"
}: RsvpEntryModalProps) {
  const storageKey = `wedding-letter:rsvp-modal-hidden:v3:${invitationId}`;
  const [popupOpen, setPopupOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<RsvpFormState>(defaultForm);

  useEffect(() => {
    if (enabled) {
      const today = todayKeyValue();
      const hiddenDate = window.localStorage.getItem(storageKey);
      if (hiddenDate !== today) {
        setPopupOpen(true);
      }
    }
  }, [enabled, storageKey]);

  if (!enabled) return null;

  const openFormModal = () => {
    setPopupOpen(false);
    setErrorMessage("");
    setFormOpen(true);
  };

  const closePopupForToday = () => {
    window.localStorage.setItem(storageKey, todayKeyValue());
    setPopupOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrorMessage("성함을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const endpoint = preview
        ? `/api/invitations/${encodeURIComponent(invitationId)}/rsvps`
        : `/api/public/invitations/${encodeURIComponent(slug)}/rsvps`;
      await apiFetch<{ message: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          attending: form.attending,
          partyCount: form.partyCount,
          meal: form.meal,
          note: form.note.trim() ? form.note.trim() : null,
        }),
      });

      setForm(defaultForm);
      setFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "참석 의사 전달에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {popupOpen ? (
        <div
          className={
            embedded
              ? "absolute inset-0 z-[120] flex items-end justify-center bg-black/45 p-0"
              : "fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0"
          }
          style={{ fontFamily: rsvpFontFamily }}
        >
          <div className="w-full max-w-[420px] rounded-t-[28px] bg-white px-5 pb-8 pt-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            <button className="ml-auto block text-gray-400 hover:text-gray-900 transition-colors" type="button" onClick={() => setPopupOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mt-2 text-center">
              <div className="text-3xl mb-1">👥</div>
              <p className="text-[22px] font-bold text-gray-800 tracking-tight">{rsvpTitle}</p>
              <p className="mt-4 text-[13.5px] leading-relaxed text-theme-secondary opacity-80 whitespace-pre-wrap">{rsvpMessage}</p>
            </div>

            <div className="my-6 border-t border-warm/60" />

            <div className="space-y-3 text-[13px] text-theme-secondary">
              <p className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-gray-400">calendar_month</span>
                <span className="font-medium text-theme-secondary">{weddingDateText}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-gray-400">home_pin</span>
                <span className="font-medium text-theme-secondary">{venueName}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-gray-400">location_on</span>
                <span className="font-medium text-theme-secondary">{venueAddress}</span>
              </p>
            </div>

            <div className="my-6 border-t border-warm/60" />

            <div className="flex items-center justify-between">
              <button className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4" onClick={closePopupForToday} type="button">
                오늘 하루 보지 않기
              </button>
              <button
                className="rounded-xl border border-warm px-5 py-2.5 text-[12px] font-bold text-theme-secondary hover:bg-theme transition-colors"
                onClick={openFormModal}
                type="button"
              >
                {rsvpButtonText}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <div
          className={
            embedded
              ? "absolute inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              : "fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          }
        >
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <button className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-gray-600" onClick={() => setFormOpen(false)} type="button">
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-center text-xl font-semibold text-gray-800">참석 의사 전달</h3>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-gray-500">성함</span>
                <input
                  className="input-premium"
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="참석자 성함"
                  value={form.name}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-gray-500">참석 여부</span>
                  <select
                    className="input-premium"
                    onChange={(event) => setForm((prev) => ({ ...prev, attending: event.target.value === "true" }))}
                    value={String(form.attending)}
                  >
                    <option value="true">참석합니다</option>
                    <option value="false">참석이 어렵습니다</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold text-gray-500">식사 여부</span>
                  <select
                    className="input-premium"
                    onChange={(event) => setForm((prev) => ({ ...prev, meal: event.target.value === "true" }))}
                    value={String(form.meal)}
                  >
                    <option value="true">식사 예정</option>
                    <option value="false">식사 안함</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold text-gray-500">동행 인원</span>
                <input
                  className="input-premium"
                  max={20}
                  min={1}
                  onChange={(event) => setForm((prev) => ({ ...prev, partyCount: Number(event.target.value) || 1 }))}
                  type="number"
                  value={form.partyCount}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold text-gray-500">전달 메모 (선택)</span>
                <textarea
                  className="input-premium min-h-24"
                  onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="축하 메시지 또는 전달사항을 남겨주세요."
                  value={form.note}
                />
              </label>

              {errorMessage ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p> : null}

              <button className="w-full rounded-xl bg-theme-brand py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">
                {submitting ? "전달 중..." : "참석 의사 전달하기"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
