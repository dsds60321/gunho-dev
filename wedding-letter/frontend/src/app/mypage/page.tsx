"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthMe, logout } from "@/lib/auth";
import { apiFetch, apiFetchRaw, isApiError } from "@/lib/api";
import { resolveAssetUrl } from "@/lib/assets";

type RsvpStatus = "attending" | "declined";

type MyInvitation = {
  id: number;
  slug?: string | null;
  published: boolean;
  templateId?: string | null;
  title: string;
  weddingDate?: string | null;
  mainImageUrl?: string | null;
  updatedAt?: string | null;
};

type MyRsvp = {
  invitationId: number;
  invitationTitle: string;
  name: string;
  attending: boolean;
  partyCount: number;
  meal: boolean;
  note?: string | null;
  createdAt: string;
};

type MyGuestbook = {
  id: number;
  invitationId: number;
  invitationTitle: string;
  name: string;
  content: string;
  createdAt: string;
};

function formatDateText(value?: string | null): string {
  if (!value) return "날짜 미입력";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeddingDateTime(value?: string | null): string {
  if (!value) return "예식 일시 미입력";

  const normalized = value.trim();
  if (!normalized) return "예식 일시 미입력";

  // 2028-03-14T14:20 또는 2028-03-14 14:20 형태를 yyyy-mm-dd hh:mm:ss 로 통일
  const directMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (directMatch) {
    const [, datePart, hh, mm, ss] = directMatch;
    return `${datePart} ${hh}:${mm}:${ss ?? "00"}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  const yyyy = parsed.getFullYear();
  const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const dd = `${parsed.getDate()}`.padStart(2, "0");
  const hh = `${parsed.getHours()}`.padStart(2, "0");
  const min = `${parsed.getMinutes()}`.padStart(2, "0");
  const sec = `${parsed.getSeconds()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

function formatRsvpStatus(attending: boolean): RsvpStatus {
  return attending ? "attending" : "declined";
}

export default function MyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [memberName, setMemberName] = useState("회원");
  const [memberId, setMemberId] = useState("0000000000");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"invitations" | "rsvp" | "guestbook">("invitations");
  const [rsvpFilter, setRsvpFilter] = useState<"all" | RsvpStatus>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [guestbookSearch, setGuestbookSearch] = useState("");
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [rsvps, setRsvps] = useState<MyRsvp[]>([]);
  const [guestbooks, setGuestbooks] = useState<MyGuestbook[]>([]);
  const [deletingInvitationId, setDeletingInvitationId] = useState<number | null>(null);
  const [deletingGuestbookId, setDeletingGuestbookId] = useState<number | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const me = await fetchAuthMe();
        if (!me.loggedIn) {
          router.replace("/login");
          return;
        }

        setMemberName(me.name ?? "회원");
        setIsAdmin(Boolean(me.isAdmin));
        const normalizedId = (me.userId ?? "3386306573").replace(/[^a-zA-Z0-9]/g, "").slice(-10);
        setMemberId(normalizedId.padStart(10, "0"));

        const [myInvitations, myRsvps, myGuestbooks] = await Promise.all([
          apiFetch<MyInvitation[]>("/api/invitations/me", { cache: "no-store" }),
          apiFetch<MyRsvp[]>("/api/rsvps/me", { cache: "no-store" }),
          apiFetch<MyGuestbook[]>("/api/invitations/me/guestbooks", { cache: "no-store" }),
        ]);

        setInvitations(myInvitations);
        setRsvps(myRsvps);
        setGuestbooks(myGuestbooks);
        setReady(true);
      } catch (error) {
        if (isApiError(error) && error.redirectedToLogin) {
          return;
        }
        router.replace("/");
      }
    };

    void initialize();
  }, [router]);

  const rsvpStats = useMemo(() => {
    const total = rsvps.length;
    const attending = rsvps.filter((row) => row.attending).length;
    const declined = rsvps.filter((row) => !row.attending).length;
    const mealRequested = rsvps.filter((row) => row.meal).length;
    return { total, attending, declined, mealRequested };
  }, [rsvps]);

  const filteredRsvpRows = useMemo(() => {
    const normalizedQuery = searchKeyword.trim().toLowerCase();

    return rsvps.filter((row) => {
      const rowStatus = formatRsvpStatus(row.attending);
      const statusMatched = rsvpFilter === "all" ? true : rowStatus === rsvpFilter;
      const queryMatched =
        normalizedQuery.length === 0 ||
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.invitationTitle.toLowerCase().includes(normalizedQuery) ||
        formatDateText(row.createdAt).toLowerCase().includes(normalizedQuery);

      return statusMatched && queryMatched;
    });
  }, [rsvps, rsvpFilter, searchKeyword]);

  const filteredGuestbookRows = useMemo(() => {
    const normalizedQuery = guestbookSearch.trim().toLowerCase();
    return guestbooks.filter((row) => {
      if (!normalizedQuery) return true;
      return (
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.invitationTitle.toLowerCase().includes(normalizedQuery) ||
        row.content.toLowerCase().includes(normalizedQuery) ||
        formatDateText(row.createdAt).toLowerCase().includes(normalizedQuery)
      );
    });
  }, [guestbooks, guestbookSearch]);

  const downloadCsv = async () => {
    try {
      const response = await apiFetchRaw("/api/invitations/me/rsvps.csv", {
        method: "GET",
      });

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "my-rsvps.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // ignore
    }
  };

  const deleteInvitation = async (invitationId: number) => {
    const target = invitations.find((item) => item.id === invitationId);
    if (target?.published) {
      window.alert("발행된 청첩장은 삭제할 수 없습니다.");
      return;
    }

    if (!window.confirm("이 청첩장을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.")) {
      return;
    }

    setDeletingInvitationId(invitationId);
    try {
      await apiFetch<{ message: string }>(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });
      setInvitations((prev) => prev.filter((item) => item.id !== invitationId));
    } catch {
      window.alert("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setDeletingInvitationId(null);
    }
  };

  const deleteGuestbook = async (guestbookId: number) => {
    if (!window.confirm("이 방명록을 삭제하시겠습니까?")) {
      return;
    }

    setDeletingGuestbookId(guestbookId);
    try {
      await apiFetch<{ message: string }>(`/api/invitations/me/guestbooks/${guestbookId}`, {
        method: "DELETE",
      });
      setGuestbooks((prev) => prev.filter((row) => row.id !== guestbookId));
    } catch {
      window.alert("방명록 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingGuestbookId(null);
    }
  };

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-theme-secondary">로그인 상태 확인 중...</div>;
  }

  return (
    <div className="min-h-screen bg-theme">
      <header className="border-b border-warm bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button className="serif-font text-2xl font-semibold text-theme-brand" type="button" onClick={() => router.push("/")}>
            WeddingLetter
          </button>
          <div className="flex items-center gap-3">
            <button
              className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme"
              type="button"
              onClick={() => router.push("/")}
            >
              돌아가기
            </button>
            <button
              className="rounded-full bg-theme-brand px-4 py-2 text-xs font-bold text-white"
              type="button"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-warm bg-white p-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-theme text-theme-brand">
                <span className="material-symbols-outlined text-[32px]">person</span>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-theme-brand">{memberId}</p>
                <p className="mt-1 text-xs text-theme-secondary">{memberName}님</p>
              </div>
            </div>

            <div className="mt-8 space-y-2 border-t border-warm pt-6">
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  activeMenu === "invitations" ? "bg-theme font-semibold text-theme-brand" : "font-medium text-theme-secondary hover:bg-theme"
                }`}
                type="button"
                onClick={() => setActiveMenu("invitations")}
              >
                청첩장 목록
              </button>
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  activeMenu === "rsvp" ? "bg-theme font-semibold text-theme-brand" : "font-medium text-theme-secondary hover:bg-theme"
                }`}
                type="button"
                onClick={() => setActiveMenu("rsvp")}
              >
                RSVP 관리
              </button>
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  activeMenu === "guestbook" ? "bg-theme font-semibold text-theme-brand" : "font-medium text-theme-secondary hover:bg-theme"
                }`}
                type="button"
                onClick={() => setActiveMenu("guestbook")}
              >
                방명록 관리
              </button>
            </div>

            <div className="mt-6 border-t border-warm pt-6 text-sm text-theme-secondary">
              {isAdmin ? (
                <>
                  <button
                    className="block py-2 transition-colors hover:text-theme-brand"
                    type="button"
                    onClick={() => router.push("/mypage/admin/users")}
                  >
                    관리자 사용자 관리
                  </button>
                  <button
                    className="block py-2 transition-colors hover:text-theme-brand"
                    type="button"
                    onClick={() => router.push("/mypage/admin/notices")}
                  >
                    관리자 공지 관리
                  </button>
                </>
              ) : null}
              <button
                className="block py-2 transition-colors hover:text-theme-brand"
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                로그아웃
              </button>
              <button className="block py-2 text-red-400" type="button">
                회원 탈퇴 (준비중)
              </button>
            </div>
          </aside>

          <section className="space-y-5">
            {activeMenu === "invitations" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-theme-brand">내 청첩장</h1>
                  <button
                    className="rounded-xl bg-theme-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-100"
                    type="button"
                    onClick={() => router.push("/editor")}
                  >
                    + 새 청첩장 만들기
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {invitations.map((item) => (
                    <article className="overflow-hidden rounded-3xl border border-warm bg-white" key={item.id}>
                      <div className="relative h-[170px] bg-theme">
                        {item.mainImageUrl ? (
                          <img className="h-full w-full object-cover" src={resolveAssetUrl(item.mainImageUrl)} alt={`${item.title}-thumbnail`} />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-theme-secondary">mail</span>
                          </div>
                        )}
                        <span className={`absolute top-4 right-4 rounded-full px-3 py-1 text-[10px] font-bold text-white ${item.published ? "bg-green-500" : "bg-gray-500"}`}>
                          {item.published ? "발행됨" : "작성중"}
                        </span>
                      </div>
                      <div className="space-y-4 p-5">
                        <div>
                          <p className="text-2xl font-semibold text-theme-brand">{item.title}</p>
                          <p className="mt-1 text-xs text-theme-secondary">{formatWeddingDateTime(item.weddingDate)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="rounded-xl border border-warm py-3 text-sm font-semibold text-theme-secondary transition-colors hover:bg-theme"
                            type="button"
                            onClick={() => router.push(`/editor?id=${item.id}`)}
                          >
                            수정하기
                          </button>
                          <button
                            className="rounded-xl bg-theme px-4 py-3 text-sm font-semibold text-theme-brand transition-colors hover:bg-[#f7ece5]"
                            type="button"
                            onClick={() => {
                              if (item.slug) {
                                router.push(`/invitation/${item.slug}`);
                              }
                            }}
                            disabled={!item.slug}
                          >
                            보기
                          </button>
                          <button
                            className="col-span-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => void deleteInvitation(item.id)}
                            disabled={item.published || deletingInvitationId === item.id}
                          >
                            {item.published ? "발행된 청첩장 삭제 불가" : deletingInvitationId === item.id ? "삭제중..." : "삭제하기"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {invitations.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-warm bg-white p-12 text-center text-sm text-theme-secondary">
                      생성된 초대장이 없습니다. 새 청첩장을 만들어 주세요.
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {activeMenu === "rsvp" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-theme-brand">RSVP 관리</h1>
                  <button
                    className="rounded-xl border border-warm bg-white px-5 py-3 text-sm font-bold text-theme-secondary"
                    type="button"
                    onClick={downloadCsv}
                  >
                    명단 다운로드 (CSV)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-warm bg-white p-4">
                    <p className="text-[10px] font-bold tracking-[0.12em] text-theme-secondary uppercase">Total</p>
                    <p className="mt-2 text-3xl serif-font text-theme-brand">{rsvpStats.total}</p>
                  </div>
                  <div className="rounded-2xl border border-warm bg-white p-4">
                    <p className="text-[10px] font-bold tracking-[0.12em] text-theme-secondary uppercase">참석</p>
                    <p className="mt-2 text-3xl serif-font text-theme-accent">{rsvpStats.attending}</p>
                  </div>
                  <div className="rounded-2xl border border-warm bg-white p-4">
                    <p className="text-[10px] font-bold tracking-[0.12em] text-theme-secondary uppercase">미참석</p>
                    <p className="mt-2 text-3xl serif-font text-theme-brand">{rsvpStats.declined}</p>
                  </div>
                  <div className="rounded-2xl border border-warm bg-white p-4">
                    <p className="text-[10px] font-bold tracking-[0.12em] text-theme-secondary uppercase">식사 신청</p>
                    <p className="mt-2 text-3xl serif-font text-theme-brand">{rsvpStats.mealRequested}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                        rsvpFilter === "all" ? "bg-theme-brand text-white" : "border border-warm bg-white text-theme-secondary hover:bg-theme"
                      }`}
                      type="button"
                      onClick={() => setRsvpFilter("all")}
                    >
                      전체
                    </button>
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                        rsvpFilter === "attending" ? "bg-theme-brand text-white" : "border border-warm bg-white text-theme-secondary hover:bg-theme"
                      }`}
                      type="button"
                      onClick={() => setRsvpFilter("attending")}
                    >
                      참석
                    </button>
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                        rsvpFilter === "declined" ? "bg-theme-brand text-white" : "border border-warm bg-white text-theme-secondary hover:bg-theme"
                      }`}
                      type="button"
                      onClick={() => setRsvpFilter("declined")}
                    >
                      미참석
                    </button>
                  </div>

                  <div className="relative w-full max-w-[260px]">
                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-theme-secondary">
                      search
                    </span>
                    <input
                      className="w-full rounded-full border border-warm bg-white py-2 pr-4 pl-10 text-sm text-theme-brand outline-none transition-colors focus:border-[var(--theme-accent)]"
                      type="text"
                      placeholder="이름/응답 검색"
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-warm bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-theme">
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">하객 성함</th>
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">참석 여부</th>
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">초대장</th>
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">식사 신청</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">응답 일시</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-divider)]">
                      {filteredRsvpRows.length > 0
                        ? filteredRsvpRows.map((row, index) => (
                            <tr className="hover:bg-[var(--theme-bg)]" key={`${row.invitationId}-${row.name}-${index}`}>
                              <td className="px-6 py-4 font-semibold text-theme-brand">{row.name}</td>
                              <td className="px-6 py-4">
                                {row.attending ? (
                                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-600">참석</span>
                                ) : (
                                  <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-400">미참석</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-theme-secondary">{row.invitationTitle}</td>
                              <td className="px-6 py-4 text-sm text-theme-secondary">{row.meal ? "희망함" : "희망안함"}</td>
                              <td className="px-6 py-4 text-right text-xs text-theme-secondary">{formatDateText(row.createdAt)}</td>
                            </tr>
                          ))
                        : null}
                      {filteredRsvpRows.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-theme-secondary" colSpan={5}>
                            검색/필터 결과가 없습니다.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {activeMenu === "guestbook" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-theme-brand">방명록 관리</h1>
                  <div className="rounded-full border border-warm bg-white px-4 py-2 text-xs font-bold text-theme-secondary">
                    총 {guestbooks.length}건
                  </div>
                </div>

                <div className="relative w-full max-w-[320px]">
                  <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-theme-secondary">
                    search
                  </span>
                  <input
                    className="w-full rounded-full border border-warm bg-white py-2 pr-4 pl-10 text-sm text-theme-brand outline-none transition-colors focus:border-[var(--theme-accent)]"
                    type="text"
                    placeholder="이름/내용/초대장 검색"
                    value={guestbookSearch}
                    onChange={(event) => setGuestbookSearch(event.target.value)}
                  />
                </div>

                <div className="overflow-hidden rounded-3xl border border-warm bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-theme">
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">작성자</th>
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">내용</th>
                        <th className="px-6 py-4 text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">초대장</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">등록 일시</th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold tracking-[0.08em] text-theme-secondary uppercase">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-divider)]">
                      {filteredGuestbookRows.length > 0
                        ? filteredGuestbookRows.map((row) => (
                            <tr className="hover:bg-[var(--theme-bg)]" key={row.id}>
                              <td className="px-6 py-4 font-semibold text-theme-brand">{row.name}</td>
                              <td className="px-6 py-4 text-sm text-theme-secondary">
                                <p className="max-w-[440px] truncate">{row.content}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-theme-secondary">{row.invitationTitle}</td>
                              <td className="px-6 py-4 text-right text-xs text-theme-secondary">{formatDateText(row.createdAt)}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  type="button"
                                  onClick={() => void deleteGuestbook(row.id)}
                                  disabled={deletingGuestbookId === row.id}
                                >
                                  {deletingGuestbookId === row.id ? "삭제중..." : "삭제"}
                                </button>
                              </td>
                            </tr>
                          ))
                        : null}
                      {filteredGuestbookRows.length === 0 ? (
                        <tr>
                          <td className="px-6 py-10 text-center text-sm text-theme-secondary" colSpan={5}>
                            표시할 방명록이 없습니다.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
