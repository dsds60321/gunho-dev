import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { resolveAssetUrl } from "@/lib/assets";
import InvitationMobileView, { type InvitationMobileViewData } from "./InvitationMobileView";

type InvitationData = InvitationMobileViewData & {
  seoTitle?: string;
  seoDescription?: string;
  seoImageUrl?: string;
  mapImageUrl?: string;
};

type InvitationRouteParams = {
  invitationId: string;
};

type InvitationPageProps = {
  params: Promise<InvitationRouteParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_API_BASE_URL = "http://localhost:8080";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.WEDDING_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function normalizeInvitation(data: Partial<InvitationData>, invitationId: string): InvitationData {
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];

  const messageLines =
    data.messageLines && data.messageLines.length > 0
      ? data.messageLines
      : typeof data.message === "string"
        ? (data.message ?? "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        : [];

  return {
    id: String(data.id ?? invitationId),
    slug: data.slug ? String(data.slug) : invitationId,
    groomName: data.groomName ?? "신랑",
    brideName: data.brideName ?? "신부",
    weddingDateTime: data.weddingDateTime ?? (data as { date?: string }).date ?? "",
    venueName: data.venueName ?? (data as { locationName?: string }).locationName ?? "예식장 정보 미입력",
    venueAddress: data.venueAddress ?? (data as { address?: string }).address ?? "주소 정보 미입력",
    coverImageUrl: data.coverImageUrl ?? "",
    mainImageUrl: data.mainImageUrl ?? data.coverImageUrl ?? imageUrls[0] ?? "",
    mapImageUrl: data.mapImageUrl ?? "",
    imageUrls,
    messageLines,
    message: data.message,
    groomContact: data.groomContact,
    brideContact: data.brideContact,
    groomFatherName: data.groomFatherName,
    groomFatherContact: data.groomFatherContact,
    groomMotherName: data.groomMotherName,
    groomMotherContact: data.groomMotherContact,
    brideFatherName: data.brideFatherName,
    brideFatherContact: data.brideFatherContact,
    brideMotherName: data.brideMotherName,
    brideMotherContact: data.brideMotherContact,
    subway: data.subway,
    bus: data.bus,
    car: data.car,
    useSeparateAccounts: data.useSeparateAccounts ?? false,
    useGuestbook: data.useGuestbook ?? true,
    useRsvpModal: data.useRsvpModal ?? true,
    fontFamily: data.fontFamily,
    fontColor: data.fontColor,
    fontSize: data.fontSize,
    accountNumber: data.accountNumber,
    groomAccountNumber: data.groomAccountNumber,
    brideAccountNumber: data.brideAccountNumber,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    seoImageUrl: data.seoImageUrl,
    galleryTitle: data.galleryTitle ?? "웨딩 갤러리",
    galleryType: data.galleryType ?? "swipe",
    themeBackgroundColor: data.themeBackgroundColor ?? "#fdf8f5",
    themeTextColor: data.themeTextColor ?? "#4a2c2a",
    themeAccentColor: data.themeAccentColor ?? "#803b2a",
    themePattern: data.themePattern ?? "none",
    themeEffectType: data.themeEffectType ?? "none",
    themeFontFamily: data.themeFontFamily ?? "'Noto Sans KR', sans-serif",
    themeFontSize: data.themeFontSize ?? 16,
    themeScrollReveal: data.themeScrollReveal ?? false,
    heroDesignId: data.heroDesignId ?? "simply-meant",
    heroEffectType: data.heroEffectType === "shadow" ? "none" : (data.heroEffectType ?? "none"),
    heroEffectParticleCount: data.heroEffectParticleCount ?? 30,
    heroEffectSpeed: data.heroEffectSpeed ?? 100,
    heroEffectOpacity: data.heroEffectOpacity ?? 72,
    messageFontFamily: data.messageFontFamily ?? "'Noto Sans KR', sans-serif",
    transportFontFamily: data.transportFontFamily ?? "'Noto Sans KR', sans-serif",
    rsvpTitle: data.rsvpTitle ?? "참석 의사 전달",
    rsvpMessage: data.rsvpMessage ?? "특별한 날 축하의 마음으로 참석해주시는 모든 분들을 위해\n참석 여부 전달을 부탁드립니다.",
    rsvpButtonText: data.rsvpButtonText ?? "참석의사 전달하기",
    rsvpFontFamily: data.rsvpFontFamily ?? "'Noto Sans KR', sans-serif",
    detailContent: data.detailContent,
    locationTitle: data.locationTitle ?? "오시는 길",
    locationFloorHall: data.locationFloorHall,
    locationContact: data.locationContact,
    showMap: data.showMap ?? true,
    lockMap: data.lockMap ?? false,
  };
}

async function fetchInvitationFromBackend(invitationId: string): Promise<InvitationData | null> {
  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}/api/public/invitations/${encodeURIComponent(invitationId)}`, {
      method: "GET",
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Partial<InvitationData>;
    return normalizeInvitation(payload, invitationId);
  } catch {
    return null;
  }
}

async function fetchInvitationForPreview(invitationId: string): Promise<InvitationData | null> {
  const apiBaseUrl = getApiBaseUrl();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${apiBaseUrl}/api/invitations/${encodeURIComponent(invitationId)}`, {
      method: "GET",
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Partial<InvitationData>;
    return normalizeInvitation(payload, invitationId);
  } catch {
    return null;
  }
}

function parsePreviewFlag(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => entry === "1" || entry.toLowerCase() === "true");
  }
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

async function getInvitationData(invitationId?: string, options?: { preview?: boolean }): Promise<InvitationData | null> {
  const resolvedId = invitationId?.trim();
  if (!resolvedId) return null;

  if (options?.preview) {
    return fetchInvitationForPreview(resolvedId);
  }

  return fetchInvitationFromBackend(resolvedId);
}

function formatInvitationDate(dateTime: string) {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    return { infoDate: "예식 일시 정보 미입력" };
  }

  const weekdayKo = ["일", "월", "화", "수", "목", "금", "토"][parsed.getDay()];
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = parsed.getHours();
  const minute = String(parsed.getMinutes()).padStart(2, "0");
  const ampmText = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return { infoDate: `${year}년 ${Number(month)}월 ${Number(day)}일 ${weekdayKo}요일 ${ampmText} ${hour12}시 ${minute}분` };
}

function buildMetadata(invitation: InvitationData, invitationId: string): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const apiBaseUrl = getApiBaseUrl();
  const canonicalSlug = invitation.slug ?? invitationId;
  const canonical = `${siteUrl}/invitation/${encodeURIComponent(canonicalSlug)}`;

  const title = invitation.seoTitle ?? `${invitation.groomName} & ${invitation.brideName} 결혼식에 초대합니다`;
  const description = invitation.seoDescription ?? `${formatInvitationDate(invitation.weddingDateTime).infoDate}, ${invitation.venueName}`;
  const metadataImage = invitation.seoImageUrl ?? invitation.mainImageUrl ?? invitation.coverImageUrl ?? invitation.imageUrls[0] ?? "";
  const imageUrl = resolveAssetUrl(metadataImage, apiBaseUrl);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: `${invitation.groomName} ${invitation.brideName} 청첩장 대표 이미지`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export async function generateMetadata({ params, searchParams }: InvitationPageProps): Promise<Metadata> {
  const { invitationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isPreview = parsePreviewFlag(resolvedSearchParams?.preview);
  const invitation = await getInvitationData(invitationId, { preview: isPreview });

  if (!invitation) {
    return {
      title: "페이지를 찾을 수 없습니다.",
      description: "요청하신 청첩장을 찾을 수 없습니다.",
      robots: { index: false, follow: false },
    };
  }

  return buildMetadata(invitation, invitation.id);
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { invitationId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isPreview = parsePreviewFlag(resolvedSearchParams?.preview);
  const invitation = await getInvitationData(invitationId, { preview: isPreview });

  if (!invitation) {
    notFound();
  }

  const apiBaseUrl = getApiBaseUrl();

  return (
    <InvitationMobileView
      invitation={invitation}
      apiBaseUrl={apiBaseUrl}
      preview={isPreview}
      invitationIdForActions={invitation.id}
      slugForActions={invitation.slug ?? invitationId}
    />
  );
}
