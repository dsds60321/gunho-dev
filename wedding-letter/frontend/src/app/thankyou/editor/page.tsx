"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthMe, logout } from "@/lib/auth";
import { apiFetch, getApiErrorMessage, isApiError } from "@/lib/api";
import { resolveAssetUrl } from "@/lib/assets";
import RichTextEditor from "@/components/editor/RichTextEditor";
import MobilePreviewFrame from "@/components/editor/MobilePreviewFrame";
import EditorToast, { useEditorToast } from "@/components/editor/EditorToast";
import ThankyouMobileView from "@/app/thankyou/[thankyouId]/ThankyouMobileView";
import type { ThankyouEditorPayload, ThankyouPublishResponse } from "@/types/thankyou";
import "react-quill-new/dist/quill.snow.css";

type SenderType = "couple" | "parents";

type FormState = {
  themeId: string;
  title: string;
  senderType: SenderType;
  groomName: string;
  brideName: string;
  groomParentName: string;
  brideParentName: string;
  recipientName: string;
  headingPrefixText: string;
  headingPrefixColor: string;
  headingPrefixFontSize: number;
  headingTitleColor: string;
  headingTitleFontSize: number;
  eventDate: string;
  mainImageUrl: string;
  mainCaption: string;
  greetingHtml: string;
  detailBodyText: string;
  endingImageUrl: string;
  endingCaption: string;
  slug: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  themeBackgroundColor: string;
  themeTextColor: string;
  themeAccentColor: string;
  themePattern: string;
  themeEffectType: string;
  themeFontFamily: string;
  themeFontSize: number;
  themeScrollReveal: boolean;
};

const defaultFormState: FormState = {
  themeId: "classic-thankyou",
  title: "",
  senderType: "couple",
  groomName: "",
  brideName: "",
  groomParentName: "",
  brideParentName: "",
  recipientName: "",
  headingPrefixText: "",
  headingPrefixColor: "#df9a9d",
  headingPrefixFontSize: 25,
  headingTitleColor: "#524b51",
  headingTitleFontSize: 29,
  eventDate: "",
  mainImageUrl: "",
  mainCaption: "",
  greetingHtml: "",
  detailBodyText: "",
  endingImageUrl: "",
  endingCaption: "",
  slug: "",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
  themeBackgroundColor: "#fdf8f5",
  themeTextColor: "#4a2c2a",
  themeAccentColor: "#803b2a",
  themePattern: "none",
  themeEffectType: "none",
  themeFontFamily: "'Noto Sans KR', sans-serif",
  themeFontSize: 16,
  themeScrollReveal: false,
};

const THEME_PATTERN_OPTIONS = [
  { id: "none", name: "없음" },
  { id: "dot", name: "도트" },
  { id: "grid", name: "그리드" },
  { id: "linen", name: "린넨" },
  { id: "petal", name: "꽃잎 무늬" },
];

const THEME_EFFECT_OPTIONS = [
  { id: "none", name: "없음" },
  { id: "cherry-blossom", name: "벚꽃" },
  { id: "snow", name: "눈" },
  { id: "falling-leaves", name: "낙엽" },
  { id: "baby-breath", name: "안개꽃" },
  { id: "forsythia", name: "개나리" },
];

const THEME_FONT_OPTIONS = [
  { value: "'Noto Sans KR', sans-serif", label: "Noto Sans KR" },
  { value: "'Pretendard', 'Noto Sans KR', sans-serif", label: "Pretendard" },
  { value: "'Noto Serif KR', serif", label: "Noto Serif KR" },
];

function normalizeSenderType(value?: string | null): SenderType {
  return value === "parents" ? "parents" : "couple";
}

function sanitizeColorValue(value: string, fallback: string): string {
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

function clampThemeFontSize(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.min(28, Math.max(12, Math.round(value)));
}

function clampHeadingPrefixFontSize(value: number): number {
  if (!Number.isFinite(value)) return defaultFormState.headingPrefixFontSize;
  return Math.min(64, Math.max(16, Math.round(value)));
}

function clampHeadingTitleFontSize(value: number): number {
  if (!Number.isFinite(value)) return defaultFormState.headingTitleFontSize;
  return Math.min(96, Math.max(28, Math.round(value)));
}

function normalizeLegacyHeadingPrefixSize(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return defaultFormState.headingPrefixFontSize;
  const rounded = Math.round(value as number);
  if (rounded === 30) return defaultFormState.headingPrefixFontSize;
  return clampHeadingPrefixFontSize(rounded);
}

function normalizeLegacyHeadingTitleSize(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return defaultFormState.headingTitleFontSize;
  const rounded = Math.round(value as number);
  if (rounded === 58) return defaultFormState.headingTitleFontSize;
  return clampHeadingTitleFontSize(rounded);
}

function toDateTimeLocalValue(rawDate?: string | null): string {
  if (!rawDate) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDate)) return rawDate;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return rawDate.slice(0, 16);

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  const hour = `${parsed.getHours()}`.padStart(2, "0");
  const minute = `${parsed.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function stripRichText(rawHtml: string): string {
  return rawHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function buildSenderDisplayFromForm(form: Pick<FormState, "senderType" | "groomName" | "brideName" | "groomParentName" | "brideParentName">): string {
  if (form.senderType === "parents") {
    const groomParentName = form.groomParentName.trim();
    const brideParentName = form.brideParentName.trim();
    if (groomParentName && brideParentName) {
      return `${groomParentName} · ${brideParentName} 드림(혼주)`;
    }
    return "혼주";
  }

  const groomName = form.groomName.trim();
  const brideName = form.brideName.trim();
  if (groomName && brideName) {
    return `신랑 ${groomName} · 신부 ${brideName} 드림`;
  }
  return "신랑 · 신부";
}

function buildFormStateFromPayload(payload: ThankyouEditorPayload): FormState {
  const senderType = normalizeSenderType(payload.basicInfo.senderType);
  return {
    themeId: payload.themeId || defaultFormState.themeId,
    title: payload.basicInfo.title ?? "",
    senderType,
    groomName: payload.basicInfo.groomName ?? "",
    brideName: payload.basicInfo.brideName ?? "",
    groomParentName: payload.basicInfo.groomParentName ?? "",
    brideParentName: payload.basicInfo.brideParentName ?? "",
    recipientName: payload.basicInfo.recipientName ?? payload.basicInfo.receiverName ?? "",
    headingPrefixText: payload.basicInfo.headingPrefixText ?? "",
    headingPrefixColor: payload.basicInfo.headingPrefixColor ?? defaultFormState.headingPrefixColor,
    headingPrefixFontSize: normalizeLegacyHeadingPrefixSize(payload.basicInfo.headingPrefixFontSize),
    headingTitleColor: payload.basicInfo.headingTitleColor ?? defaultFormState.headingTitleColor,
    headingTitleFontSize: normalizeLegacyHeadingTitleSize(payload.basicInfo.headingTitleFontSize),
    eventDate: toDateTimeLocalValue(payload.basicInfo.eventDate),
    mainImageUrl: payload.main.imageUrl ?? "",
    mainCaption: payload.main.caption ?? "",
    greetingHtml: payload.greetingHtml ?? "",
    detailBodyText: payload.detail.bodyText ?? "",
    endingImageUrl: payload.detail.ending.imageUrl ?? "",
    endingCaption: payload.detail.ending.caption ?? "",
    slug: payload.share.slug ?? "",
    ogTitle: payload.share.ogTitle ?? "",
    ogDescription: payload.share.ogDescription ?? "",
    ogImageUrl: payload.share.ogImageUrl ?? "",
    themeBackgroundColor: payload.themeBackgroundColor ?? defaultFormState.themeBackgroundColor,
    themeTextColor: payload.themeTextColor ?? defaultFormState.themeTextColor,
    themeAccentColor: payload.themeAccentColor ?? defaultFormState.themeAccentColor,
    themePattern: payload.themePattern ?? defaultFormState.themePattern,
    themeEffectType: payload.themeEffectType ?? defaultFormState.themeEffectType,
    themeFontFamily: payload.themeFontFamily ?? defaultFormState.themeFontFamily,
    themeFontSize: clampThemeFontSize(payload.themeFontSize ?? defaultFormState.themeFontSize),
    themeScrollReveal: payload.themeScrollReveal ?? defaultFormState.themeScrollReveal,
  };
}

export default function ThankyouEditorPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loadingText, setLoadingText] = useState("감사장 에디터 초기화 중...");
  const [thankyou, setThankyou] = useState<ThankyouEditorPayload | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slugStatus, setSlugStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const { toast, showToast } = useEditorToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    theme: true,
    basic: true,
    greeting: true,
    detail: true,
    share: true,
  });

  const senderDisplayText = useMemo(() => buildSenderDisplayFromForm(form), [form]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const applyPayload = (payload: ThankyouEditorPayload) => {
    setThankyou(payload);
    setForm(buildFormStateFromPayload(payload));
    if (payload.share.shareUrl) {
      setShareUrl(payload.share.shareUrl);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const me = await fetchAuthMe();
        if (!me.loggedIn) {
          router.replace("/login");
          return;
        }

        const thankyouId = new URLSearchParams(window.location.search).get("id");
        let payload: ThankyouEditorPayload;

        if (thankyouId) {
          setLoadingText("기존 감사장을 불러오는 중...");
          payload = await apiFetch<ThankyouEditorPayload>(`/api/thankyou-cards/${thankyouId}`);
        } else {
          setLoadingText("새 감사장을 생성 중...");
          payload = await apiFetch<ThankyouEditorPayload>("/api/thankyou-cards", {
            method: "POST",
            body: JSON.stringify({}),
          });
          router.replace(`/thankyou/editor?id=${payload.id}`);
        }

        applyPayload(payload);
        setReady(true);
      } catch (error) {
        if (isApiError(error) && error.redirectedToLogin) return;
        router.replace("/");
      }
    };

    void initialize();
  }, [router]);

  const handleAssetUpload = async (payload: { mainImageFile?: File; endingImageFile?: File; ogImageFile?: File }) => {
    if (!thankyou) return;

    const formData = new FormData();
    if (payload.mainImageFile) formData.append("mainImageFile", payload.mainImageFile);
    if (payload.endingImageFile) formData.append("endingImageFile", payload.endingImageFile);
    if (payload.ogImageFile) formData.append("ogImageFile", payload.ogImageFile);

    if ([...formData.keys()].length === 0) return;

    setUploading(true);
    setSlugStatus("");

    try {
      const updated = await apiFetch<ThankyouEditorPayload>(`/api/thankyou-cards/${thankyou.id}/assets`, {
        method: "POST",
        body: formData,
      });
      applyPayload(updated);
      showToast("이미지 업로드가 완료되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) return;
      showToast(getApiErrorMessage(error, "이미지 업로드에 실패했습니다."), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!thankyou) return;

    setSaving(true);
    setSlugStatus("");

    try {
      const saved = await apiFetch<ThankyouEditorPayload>(`/api/thankyou-cards/${thankyou.id}`, {
        method: "PUT",
        body: JSON.stringify({
          themeId: form.themeId,
          main: {
            imageUrl: form.mainImageUrl || null,
            caption: form.mainCaption || null,
          },
          basicInfo: {
            title: form.title || null,
            senderType: form.senderType,
            groomName: form.groomName || null,
            brideName: form.brideName || null,
            groomParentName: form.groomParentName || null,
            brideParentName: form.brideParentName || null,
            recipientName: form.recipientName || null,
            headingPrefixText: form.headingPrefixText || null,
            headingPrefixColor: sanitizeColorValue(form.headingPrefixColor, defaultFormState.headingPrefixColor),
            headingPrefixFontSize: clampHeadingPrefixFontSize(form.headingPrefixFontSize),
            headingTitleColor: sanitizeColorValue(form.headingTitleColor, defaultFormState.headingTitleColor),
            headingTitleFontSize: clampHeadingTitleFontSize(form.headingTitleFontSize),
            senderName: senderDisplayText || null,
            receiverName: form.recipientName || null,
            eventDate: form.eventDate || null,
          },
          greetingHtml: form.greetingHtml || null,
          detail: {
            bodyText: form.detailBodyText || null,
            ending: {
              imageUrl: form.endingImageUrl || null,
              caption: form.endingCaption || null,
            },
          },
          share: {
            slug: form.slug || null,
            ogTitle: form.ogTitle || null,
            ogDescription: form.ogDescription || null,
            ogImageUrl: form.ogImageUrl || null,
          },
          themeBackgroundColor: sanitizeColorValue(form.themeBackgroundColor, defaultFormState.themeBackgroundColor),
          themeTextColor: sanitizeColorValue(form.themeTextColor, defaultFormState.themeTextColor),
          themeAccentColor: sanitizeColorValue(form.themeAccentColor, defaultFormState.themeAccentColor),
          themePattern: form.themePattern,
          themeEffectType: form.themeEffectType,
          themeFontFamily: form.themeFontFamily,
          themeFontSize: clampThemeFontSize(form.themeFontSize),
          themeScrollReveal: form.themeScrollReveal,
        }),
      });
      applyPayload(saved);
      showToast("감사장 내용이 저장되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) return;
      const message = getApiErrorMessage(error, "저장에 실패했습니다.");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSlugCheck = async () => {
    if (!thankyou) return;
    if (!form.slug.trim()) {
      setSlugStatus("slug를 입력해 주세요.");
      return;
    }

    try {
      const result = await apiFetch<{ slug: string; available: boolean }>(
        `/api/thankyou-cards/slug-check?slug=${encodeURIComponent(form.slug)}&thankyouId=${thankyou.id}`,
      );
      updateField("slug", result.slug);
      setSlugStatus(result.available ? "사용 가능한 slug 입니다." : "이미 사용 중인 slug 입니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) return;
      setSlugStatus(getApiErrorMessage(error, "slug 형식을 확인해 주세요."));
    }
  };

  const handlePublish = async () => {
    if (!thankyou) return;

    if (!form.mainImageUrl.trim()) {
      showToast("메인 이미지는 발행 시 필수입니다.", "error");
      return;
    }
    if (!stripRichText(form.greetingHtml)) {
      showToast("감사 인사말을 입력해 주세요.", "error");
      return;
    }
    if (!form.title.trim()) {
      showToast("제목은 발행 시 필수입니다.", "error");
      return;
    }
    if (form.senderType === "couple" && (!form.groomName.trim() || !form.brideName.trim())) {
      showToast("신랑/신부 이름을 입력해 주세요.", "error");
      return;
    }
    if (form.senderType === "parents" && (!form.groomParentName.trim() || !form.brideParentName.trim())) {
      showToast("혼주 성함(신랑측/신부측)을 입력해 주세요.", "error");
      return;
    }

    setPublishing(true);
    try {
      const result = await apiFetch<ThankyouPublishResponse>(`/api/thankyou-cards/${thankyou.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ slug: form.slug || null }),
      });
      setShareUrl(result.shareUrl);
      setThankyou((prev) =>
        prev
          ? {
              ...prev,
              status: "published",
              published: true,
              share: { ...prev.share, slug: result.slug, shareUrl: result.shareUrl },
            }
          : prev,
      );
      updateField("slug", result.slug);
      showToast("감사장이 성공적으로 발행되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) return;
      showToast(getApiErrorMessage(error, "발행 처리 중 오류가 발생했습니다."), "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!thankyou) return;
    setUnpublishing(true);
    try {
      const updated = await apiFetch<ThankyouEditorPayload>(`/api/thankyou-cards/${thankyou.id}/unpublish`, {
        method: "POST",
      });
      applyPayload(updated);
      showToast("감사장 발행이 해제되었습니다.");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) return;
      showToast(getApiErrorMessage(error, "발행 해제에 실패했습니다."), "error");
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!thankyou) return;
    if (!window.confirm("이 감사장을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.")) return;

    setDeleting(true);
    try {
      await apiFetch<{ message: string }>(`/api/thankyou-cards/${thankyou.id}`, {
        method: "DELETE",
      });
      showToast("감사장이 삭제되었습니다.");
      router.push("/mypage");
    } catch (error) {
      if (isApiError(error) && error.redirectedToLogin) return;
      showToast(getApiErrorMessage(error, "삭제 처리 중 오류가 발생했습니다."), "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyShareUrl = async () => {
    const target = shareUrl || thankyou?.share?.shareUrl;
    if (!target) {
      showToast("공유 URL이 없습니다.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(target);
      showToast("공유 URL이 복사되었습니다.");
    } catch {
      showToast("URL 복사에 실패했습니다.", "error");
    }
  };

  const previewData = useMemo(() => {
    if (!thankyou) return null;
    return {
      id: String(thankyou.id),
      themeId: form.themeId,
      main: {
        imageUrl: form.mainImageUrl,
        caption: form.mainCaption,
      },
      basicInfo: {
        title: form.title || "감사장",
        senderType: form.senderType,
        groomName: form.groomName || null,
        brideName: form.brideName || null,
        groomParentName: form.groomParentName || null,
        brideParentName: form.brideParentName || null,
        recipientName: form.recipientName || null,
        headingPrefixText: form.headingPrefixText || null,
        headingPrefixColor: sanitizeColorValue(form.headingPrefixColor, defaultFormState.headingPrefixColor),
        headingPrefixFontSize: clampHeadingPrefixFontSize(form.headingPrefixFontSize),
        headingTitleColor: sanitizeColorValue(form.headingTitleColor, defaultFormState.headingTitleColor),
        headingTitleFontSize: clampHeadingTitleFontSize(form.headingTitleFontSize),
        senderName: senderDisplayText,
        receiverName: form.recipientName || null,
        eventDate: form.eventDate || null,
      },
      greetingHtml: form.greetingHtml,
      detail: {
        bodyText: form.detailBodyText || null,
        ending: {
          imageUrl: form.endingImageUrl || null,
          caption: form.endingCaption || null,
        },
      },
      share: {
        slug: form.slug || null,
        shareUrl: shareUrl || thankyou.share.shareUrl || null,
        ogTitle: form.ogTitle || null,
        ogDescription: form.ogDescription || null,
        ogImageUrl: form.ogImageUrl || null,
      },
      themeBackgroundColor: sanitizeColorValue(form.themeBackgroundColor, defaultFormState.themeBackgroundColor),
      themeTextColor: sanitizeColorValue(form.themeTextColor, defaultFormState.themeTextColor),
      themeAccentColor: sanitizeColorValue(form.themeAccentColor, defaultFormState.themeAccentColor),
      themePattern: form.themePattern,
      themeEffectType: form.themeEffectType,
      themeFontFamily: form.themeFontFamily,
      themeFontSize: clampThemeFontSize(form.themeFontSize),
      themeScrollReveal: form.themeScrollReveal,
    };
  }, [thankyou, form, shareUrl, senderDisplayText]);

  if (!ready || !thankyou || !previewData) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-theme-secondary">{loadingText}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-warm bg-white px-6 md:px-8">
        <div className="flex items-center gap-4">
          <button className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-900" type="button" onClick={() => router.push("/")}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="text-sm font-medium">Wedding Letter 에디터</span>
          </button>
          <div className="hidden h-4 w-px bg-[var(--theme-divider)] md:block" />
          <div className="hidden text-xs font-medium text-gray-400 md:block">감사장 ID: {thankyou.id}</div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme" type="button" onClick={handleSave} disabled={saving || uploading || publishing}>
            {saving ? "저장중..." : "저장하기"}
          </button>
          <button
            className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme"
            type="button"
            onClick={() => router.push(`/thankyou/${thankyou.id}?preview=1`)}
          >
            미리보기
          </button>
          {thankyou.published ? (
            <button className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme" type="button" onClick={copyShareUrl}>
              URL 복사
            </button>
          ) : null}
          <button className="rounded-full bg-theme-brand px-5 py-2 text-xs font-bold text-white" type="button" onClick={handlePublish} disabled={publishing || saving || uploading || deleting}>
            {publishing ? "발행중..." : "발행하기"}
          </button>
          {thankyou.published ? (
            <button className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary" type="button" onClick={handleUnpublish} disabled={unpublishing || publishing}>
              {unpublishing ? "해제중..." : "발행해제"}
            </button>
          ) : (
            <button className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-500" type="button" onClick={handleDelete} disabled={deleting || saving || publishing || uploading}>
              {deleting ? "삭제중..." : "삭제하기"}
            </button>
          )}
          <button
            className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary"
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 md:grid-cols-2">
        <section className="sticky top-0 flex h-[calc(100vh-64px)] items-center justify-center border-b border-warm bg-theme p-6 md:border-r md:border-b-0 md:p-8">
          <MobilePreviewFrame>
            <ThankyouMobileView embedded thankyou={previewData} />
          </MobilePreviewFrame>
        </section>

        <section className="custom-scrollbar overflow-y-auto bg-theme">
          <form className="mx-auto max-w-4xl px-0 py-0 md:px-0" onSubmit={handleSave}>
            <div className="space-y-2 px-6 py-10 md:px-10">
              <h1 className="serif-font text-3xl text-theme-brand">감사장 편집</h1>
              <p className="text-sm text-theme-secondary opacity-70">청첩장과 동일한 스타일로 감사 메시지를 관리하세요.</p>
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.theme ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.theme && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10" type="button" onClick={() => toggleSection("theme")}>
                <span className="text-lg font-medium text-theme-brand">테마</span>
                <span className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.theme ? "rotate-180" : ""}`}>expand_more</span>
              </button>
              {openSections.theme ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <div className="space-y-5 rounded-2xl bg-[#fdfcfb] p-6">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">색상</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">배경 색상</span>
                        <div className="flex gap-3">
                          <input className="h-10 w-14 cursor-pointer overflow-hidden rounded border border-warm" type="color" value={form.themeBackgroundColor} onChange={(event) => updateField("themeBackgroundColor", event.target.value)} />
                          <input className="input-premium flex-1" value={form.themeBackgroundColor} onChange={(event) => updateField("themeBackgroundColor", event.target.value)} />
                        </div>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">기본 텍스트 색상</span>
                        <div className="flex gap-3">
                          <input className="h-10 w-14 cursor-pointer overflow-hidden rounded border border-warm" type="color" value={form.themeTextColor} onChange={(event) => updateField("themeTextColor", event.target.value)} />
                          <input className="input-premium flex-1" value={form.themeTextColor} onChange={(event) => updateField("themeTextColor", event.target.value)} />
                        </div>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">강조 색상</span>
                        <div className="flex gap-3">
                          <input className="h-10 w-14 cursor-pointer overflow-hidden rounded border border-warm" type="color" value={form.themeAccentColor} onChange={(event) => updateField("themeAccentColor", event.target.value)} />
                          <input className="input-premium flex-1" value={form.themeAccentColor} onChange={(event) => updateField("themeAccentColor", event.target.value)} />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-5 rounded-2xl bg-[#fdfcfb] p-6">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">배경 패턴 / 이펙트</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">배경 패턴</span>
                        <select className="input-premium" value={form.themePattern} onChange={(event) => updateField("themePattern", event.target.value)}>
                          {THEME_PATTERN_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">전체 배경 이펙트</span>
                        <select className="input-premium" value={form.themeEffectType} onChange={(event) => updateField("themeEffectType", event.target.value)}>
                          {THEME_EFFECT_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">전체 글꼴</span>
                        <select className="input-premium" value={form.themeFontFamily} onChange={(event) => updateField("themeFontFamily", event.target.value)}>
                          {THEME_FONT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">기본 글꼴 크기 (px)</span>
                        <input
                          className="input-premium"
                          type="number"
                          min={12}
                          max={28}
                          value={form.themeFontSize}
                          onChange={(event) => updateField("themeFontSize", clampThemeFontSize(Number(event.target.value)))}
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-warm bg-white px-4 py-3 text-sm text-theme-secondary">
                      <input type="checkbox" checked={form.themeScrollReveal} onChange={(event) => updateField("themeScrollReveal", event.target.checked)} />
                      스크롤 진입 시 스르륵 등장(리빌) 효과 사용
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.basic ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.basic && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10" type="button" onClick={() => toggleSection("basic")}>
                <span className="text-lg font-medium text-theme-brand">기본정보</span>
                <span className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.basic ? "rotate-180" : ""}`}>expand_more</span>
              </button>
              {openSections.basic ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">날짜 (선택)</span>
                    <input className="input-premium" type="datetime-local" value={form.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} />
                  </label>

                  <div className="space-y-3 rounded-2xl bg-[#fdfcfb] p-4">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">감사장 타입</p>
                    <div className="inline-flex rounded-xl border border-warm bg-[#fcf8f5] p-1">
                      <button
                        type="button"
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                          form.senderType === "couple" ? "bg-white text-theme-brand shadow-sm" : "text-theme-secondary hover:bg-white/60"
                        }`}
                        onClick={() => updateField("senderType", "couple")}
                      >
                        신랑·신부용
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                          form.senderType === "parents" ? "bg-white text-theme-brand shadow-sm" : "text-theme-secondary hover:bg-white/60"
                        }`}
                        onClick={() => updateField("senderType", "parents")}
                      >
                        혼주용
                      </button>
                    </div>
                  </div>

                  {form.senderType === "couple" ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">신랑 이름</span>
                        <input className="input-premium" value={form.groomName} onChange={(event) => updateField("groomName", event.target.value)} placeholder="신랑 이름" />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">신부 이름</span>
                        <input className="input-premium" value={form.brideName} onChange={(event) => updateField("brideName", event.target.value)} placeholder="신부 이름" />
                      </label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">신랑측 혼주 이름</span>
                        <input className="input-premium" value={form.groomParentName} onChange={(event) => updateField("groomParentName", event.target.value)} placeholder="신랑측 혼주 이름" />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">신부측 혼주 이름</span>
                        <input className="input-premium" value={form.brideParentName} onChange={(event) => updateField("brideParentName", event.target.value)} placeholder="신부측 혼주 이름" />
                      </label>
                    </div>
                  )}

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">수신자명 (선택)</span>
                    <input className="input-premium" value={form.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} placeholder="예: OOO님" />
                  </label>

                  <div className="rounded-xl bg-[#faf5f2] px-4 py-3 text-xs text-theme-secondary">
                    <p className="font-semibold text-theme-brand">미리보기 서명</p>
                    <p className="mt-1">{senderDisplayText}</p>
                  </div>

                  <div className="space-y-4 rounded-2xl bg-[#faf5f2] p-4">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">상단 제목/문구 스타일</p>

                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">제목</span>
                      <input className="input-premium" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="감사장 제목" />
                    </label>

                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">메인 문구 (선택)</span>
                      <input className="input-premium" value={form.mainCaption} onChange={(event) => updateField("mainCaption", event.target.value)} placeholder="메인 이미지 하단 문구" />
                    </label>

                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">상단 문구</span>
                      <input
                        className="input-premium"
                        value={form.headingPrefixText}
                        onChange={(event) => updateField("headingPrefixText", event.target.value)}
                        placeholder={form.senderType === "parents" ? "고마운 마음을 담아" : "진심을 담아"}
                      />
                    </label>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">상단 문구 색상</span>
                        <div className="flex gap-3">
                          <input className="h-10 w-14 cursor-pointer overflow-hidden rounded border border-warm" type="color" value={form.headingPrefixColor} onChange={(event) => updateField("headingPrefixColor", event.target.value)} />
                          <input className="input-premium flex-1" value={form.headingPrefixColor} onChange={(event) => updateField("headingPrefixColor", event.target.value)} />
                        </div>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">상단 문구 크기 (px)</span>
                        <input
                          className="input-premium"
                          type="number"
                          min={16}
                          max={64}
                          value={form.headingPrefixFontSize}
                          onChange={(event) => updateField("headingPrefixFontSize", clampHeadingPrefixFontSize(Number(event.target.value)))}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">제목 색상</span>
                        <div className="flex gap-3">
                          <input className="h-10 w-14 cursor-pointer overflow-hidden rounded border border-warm" type="color" value={form.headingTitleColor} onChange={(event) => updateField("headingTitleColor", event.target.value)} />
                          <input className="input-premium flex-1" value={form.headingTitleColor} onChange={(event) => updateField("headingTitleColor", event.target.value)} />
                        </div>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-xs font-bold text-theme-secondary">제목 크기 (px)</span>
                        <input
                          className="input-premium"
                          type="number"
                          min={28}
                          max={96}
                          value={form.headingTitleFontSize}
                          onChange={(event) => updateField("headingTitleFontSize", clampHeadingTitleFontSize(Number(event.target.value)))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl bg-[#fdfcfb] p-6">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">메인 이미지 (1장)</p>
                    <div className="group relative mx-auto flex aspect-[3/4] w-[30%] min-w-[120px] max-w-[180px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white">
                      {form.mainImageUrl ? (
                        <>
                          <img className="h-full w-full object-cover" src={resolveAssetUrl(form.mainImageUrl)} alt="thankyou-main-preview" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-xs font-bold text-white">이미지 교체</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">메인 이미지를 업로드해 주세요</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleAssetUpload({ mainImageFile: file });
                          event.currentTarget.value = "";
                        }}
                      />
                    </div>
                    <button
                      className="rounded-xl border border-warm bg-white px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme"
                      type="button"
                      onClick={() => updateField("mainImageUrl", "")}
                    >
                      메인 이미지 삭제
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.greeting ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.greeting && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10" type="button" onClick={() => toggleSection("greeting")}>
                <span className="text-lg font-medium text-theme-brand">감사인사말</span>
                <span className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.greeting ? "rotate-180" : ""}`}>expand_more</span>
              </button>
              {openSections.greeting ? (
                <div className="space-y-4 px-6 pt-2 pb-10 md:px-10">
                  <RichTextEditor value={form.greetingHtml} onChange={(value) => updateField("greetingHtml", value)} placeholder="감사 인사말을 작성해 주세요." minHeight={180} />
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.detail ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.detail && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10" type="button" onClick={() => toggleSection("detail")}>
                <span className="text-lg font-medium text-theme-brand">상세내용</span>
                <span className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.detail ? "rotate-180" : ""}`}>expand_more</span>
              </button>
              {openSections.detail ? (
                <div className="space-y-6 px-6 pt-2 pb-10 md:px-10">
                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">상세 본문 (선택)</span>
                    <textarea
                      className="input-premium min-h-28"
                      value={form.detailBodyText}
                      onChange={(event) => updateField("detailBodyText", event.target.value)}
                      placeholder="상세 본문을 작성해 주세요."
                    />
                  </label>

                  <div className="space-y-4 rounded-2xl bg-[#fdfcfb] p-6">
                    <p className="text-xs font-bold tracking-wider text-theme-brand">엔딩 영역 (선택)</p>
                    <div className="group relative mx-auto flex aspect-[3/4] w-[30%] min-w-[120px] max-w-[180px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white">
                      {form.endingImageUrl ? (
                        <>
                          <img className="h-full w-full object-cover" src={resolveAssetUrl(form.endingImageUrl)} alt="thankyou-ending-preview" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-xs font-bold text-white">이미지 교체</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">엔딩 이미지 업로드</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleAssetUpload({ endingImageFile: file });
                          event.currentTarget.value = "";
                        }}
                      />
                    </div>
                    <button
                      className="rounded-xl border border-warm bg-white px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme"
                      type="button"
                      onClick={() => updateField("endingImageUrl", "")}
                    >
                      엔딩 이미지 삭제
                    </button>

                    <label className="space-y-2 block">
                      <span className="text-xs font-bold text-theme-secondary">엔딩 문구 (선택)</span>
                      <textarea className="input-premium min-h-24" value={form.endingCaption} onChange={(event) => updateField("endingCaption", event.target.value)} placeholder="엔딩 문구를 입력해 주세요." />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`relative border-b border-warm transition-colors ${openSections.share ? "bg-white" : "bg-[#fdfcfb]"}`}>
              {openSections.share && <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-accent" />}
              <button className="flex w-full items-center justify-between px-6 py-5 text-left md:px-10" type="button" onClick={() => toggleSection("share")}>
                <span className="text-lg font-medium text-theme-brand">공유 URL 설정</span>
                <span className={`material-symbols-outlined text-theme-secondary transition-transform duration-200 ${openSections.share ? "rotate-180" : ""}`}>expand_more</span>
              </button>
              {openSections.share ? (
                <div className="space-y-4 px-6 pt-2 pb-10 md:px-10">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">Slug</span>
                    <div className="flex gap-2">
                      <input className="input-premium flex-1" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="예: thankyou-gunho-sebin" />
                      <button className="rounded-xl border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme" type="button" onClick={handleSlugCheck}>
                        중복확인
                      </button>
                    </div>
                    {slugStatus ? <p className="text-xs text-theme-secondary">{slugStatus}</p> : null}
                  </div>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">OG 제목 (선택)</span>
                    <input className="input-premium" value={form.ogTitle} onChange={(event) => updateField("ogTitle", event.target.value)} placeholder="공유 시 표시될 제목" />
                  </label>

                  <label className="space-y-2 block">
                    <span className="text-xs font-bold text-theme-secondary">OG 설명 (선택)</span>
                    <textarea className="input-premium min-h-24" value={form.ogDescription} onChange={(event) => updateField("ogDescription", event.target.value)} placeholder="공유 시 표시될 설명" />
                  </label>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-theme-secondary">OG 이미지 (선택)</span>
                    <div className="flex gap-2">
                      <input className="input-premium flex-1" value={form.ogImageUrl} onChange={(event) => updateField("ogImageUrl", event.target.value)} placeholder="URL 입력 또는 업로드" />
                      <label className="cursor-pointer rounded-xl border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-theme">
                        업로드
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleAssetUpload({ ogImageFile: file });
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {(shareUrl || thankyou.share.shareUrl) && (
                    <div className="rounded-xl border border-warm bg-white p-4 text-xs text-theme-secondary">
                      <p className="font-bold text-theme-brand">발행 URL</p>
                      <p className="mt-1 break-all">{shareUrl || thankyou.share.shareUrl}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="px-6 py-8 md:px-10">
              <button className="w-full rounded-2xl bg-theme-brand py-3 text-sm font-bold text-white disabled:opacity-60" type="submit" disabled={saving || publishing || uploading}>
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <EditorToast toast={toast} />
    </div>
  );
}
