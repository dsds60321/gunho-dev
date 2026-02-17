"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { fetchAuthMe } from "@/lib/auth";
import LandingTopHeader from "@/components/LandingTopHeader";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import FilterBar from "@/components/admin/FilterBar";
import StatusBadge from "@/components/admin/StatusBadge";
import { ToastViewport, useToast } from "@/components/admin/Toast";
import type { AdminNoticeSummary, NoticeDetail, NoticeStatus, PagedResponse } from "@/types/notice";

type NoticeStatusFilter = "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "EXPIRED";
type BannerFilter = "ALL" | "BANNER_ONLY";
type NoticeViewStatus = Exclude<NoticeStatusFilter, "ALL"> | "HIDDEN";

function formatDate(value?: string | null): string {
  if (!value) return "-";
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

function parsePage(raw: string | null): number {
  const parsed = Number(raw ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function resolveViewStatus(row: AdminNoticeSummary): NoticeViewStatus {
  if (row.status === "DRAFT") return "DRAFT";
  if (row.status === "HIDDEN") return "HIDDEN";

  const now = Date.now();
  const startAt = new Date(row.startAt).getTime();
  const endAt = row.endAt ? new Date(row.endAt).getTime() : Number.NaN;

  if (!Number.isNaN(startAt) && now < startAt) {
    return "SCHEDULED";
  }

  if (!Number.isNaN(endAt) && now > endAt) {
    return "EXPIRED";
  }

  return "PUBLISHED";
}

function matchesDateRange(row: AdminNoticeSummary, fromDate: string, toDate: string): boolean {
  if (!fromDate && !toDate) return true;

  const startAt = new Date(row.startAt).getTime();
  if (Number.isNaN(startAt)) return false;

  const endAt = row.endAt ? new Date(row.endAt).getTime() : startAt;

  if (fromDate) {
    const fromTime = new Date(`${fromDate}T00:00:00`).getTime();
    if (!Number.isNaN(fromTime) && endAt < fromTime) return false;
  }

  if (toDate) {
    const toTime = new Date(`${toDate}T23:59:59`).getTime();
    if (!Number.isNaN(toTime) && startAt > toTime) return false;
  }

  return true;
}

function getStatusBadge(status: NoticeViewStatus): { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" } {
  switch (status) {
    case "DRAFT":
      return { label: "초안", tone: "neutral" };
    case "SCHEDULED":
      return { label: "예약", tone: "info" };
    case "PUBLISHED":
      return { label: "발행", tone: "success" };
    case "EXPIRED":
      return { label: "만료", tone: "warning" };
    case "HIDDEN":
      return { label: "중지", tone: "danger" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export default function AdminNoticesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toasts, pushToast, removeToast } = useToast();

  const [authReady, setAuthReady] = useState(false);

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<NoticeStatusFilter>("ALL");
  const [bannerFilter, setBannerFilter] = useState<BannerFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(0);
  const [payload, setPayload] = useState<PagedResponse<AdminNoticeSummary> | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmTarget, setConfirmTarget] = useState<{ id: number; title: string; nextStatus: NoticeStatus; actionLabel: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const visibleRows = useMemo(() => {
    const rows = payload?.content ?? [];

    return rows.filter((row) => {
      const viewStatus = resolveViewStatus(row);

      if (statusFilter !== "ALL" && viewStatus !== statusFilter) {
        return false;
      }

      if (bannerFilter === "BANNER_ONLY" && !row.isBanner) {
        return false;
      }

      if (!matchesDateRange(row, fromDate, toDate)) {
        return false;
      }

      return true;
    });
  }, [payload, statusFilter, bannerFilter, fromDate, toDate]);

  const syncUrl = (next: {
    q: string;
    status: NoticeStatusFilter;
    banner: BannerFilter;
    fromDate: string;
    toDate: string;
    page: number;
  }) => {
    const params = new URLSearchParams();

    if (next.q) params.set("q", next.q);
    if (next.status !== "ALL") params.set("status", next.status);
    if (next.banner !== "ALL") params.set("banner", next.banner);
    if (next.fromDate) params.set("from", next.fromDate);
    if (next.toDate) params.set("to", next.toDate);
    if (next.page > 0) params.set("page", String(next.page));

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const applyFilters = (next: Partial<{ q: string; status: NoticeStatusFilter; banner: BannerFilter; fromDate: string; toDate: string; page: number }> = {}) => {
    const applied = {
      q: (next.q ?? keyword).trim(),
      status: next.status ?? statusFilter,
      banner: next.banner ?? bannerFilter,
      fromDate: next.fromDate ?? fromDate,
      toDate: next.toDate ?? toDate,
      page: next.page ?? page,
    };

    setKeyword(applied.q);
    setStatusFilter(applied.status);
    setBannerFilter(applied.banner);
    setFromDate(applied.fromDate);
    setToDate(applied.toDate);
    setPage(applied.page);

    syncUrl(applied);
  };

  const load = async (targetPage: number, targetKeyword: string, targetStatus: NoticeStatusFilter, targetBanner: BannerFilter) => {
    const query = new URLSearchParams({
      page: String(targetPage),
      size: "20",
    });

    if (targetKeyword.trim()) {
      query.set("keyword", targetKeyword.trim());
    }

    if (targetBanner === "BANNER_ONLY") {
      query.set("isBanner", "true");
    }

    if (targetStatus === "DRAFT") {
      query.set("status", "DRAFT");
    }

    if (targetStatus === "PUBLISHED" || targetStatus === "SCHEDULED" || targetStatus === "EXPIRED") {
      query.set("status", "PUBLISHED");
    }

    const data = await apiFetch<PagedResponse<AdminNoticeSummary>>(`/api/admin/notices?${query.toString()}`, {
      cache: "no-store",
    });
    setPayload(data);
  };

  useEffect(() => {
    const guard = async () => {
      const me = await fetchAuthMe();
      if (!me.loggedIn) {
        router.replace("/login");
        return;
      }
      if (!me.isAdmin) {
        router.replace("/mypage");
        return;
      }
      setAuthReady(true);
    };

    void guard();
  }, [router]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const status = (searchParams.get("status") as NoticeStatusFilter | null) ?? "ALL";
    const banner = (searchParams.get("banner") as BannerFilter | null) ?? "ALL";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const nextPage = parsePage(searchParams.get("page"));

    setKeywordInput(q);
    setKeyword(q);
    setStatusFilter(status === "DRAFT" || status === "SCHEDULED" || status === "PUBLISHED" || status === "EXPIRED" ? status : "ALL");
    setBannerFilter(banner === "BANNER_ONLY" ? "BANNER_ONLY" : "ALL");
    setFromDate(from);
    setToDate(to);
    setPage(nextPage);
  }, [searchParams]);

  useEffect(() => {
    if (!authReady) return;

    const run = async () => {
      setLoading(true);
      try {
        await load(page, keyword, statusFilter, bannerFilter);
      } catch {
        setPayload(null);
        pushToast("공지 목록을 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [authReady, page, keyword, statusFilter, bannerFilter, pushToast]);

  const requestStatusChange = (row: AdminNoticeSummary) => {
    const viewStatus = resolveViewStatus(row);
    const isRunning = row.status === "PUBLISHED" && (viewStatus === "PUBLISHED" || viewStatus === "SCHEDULED" || viewStatus === "EXPIRED");

    setConfirmTarget({
      id: row.id,
      title: row.title,
      nextStatus: isRunning ? "HIDDEN" : "PUBLISHED",
      actionLabel: isRunning ? "중지" : "발행",
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmTarget) return;

    setActionLoading(true);
    try {
      await apiFetch<NoticeDetail>(`/api/admin/notices/${confirmTarget.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: confirmTarget.nextStatus }),
      });

      pushToast(`공지 "${confirmTarget.title}" ${confirmTarget.actionLabel} 처리 완료`, "success");
      await load(page, keyword, statusFilter, bannerFilter);
    } catch {
      pushToast("상태 변경에 실패했습니다.", "error");
    } finally {
      setActionLoading(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-theme">
      <LandingTopHeader />

      <main className="px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-5">
          <AdminPageHeader
            title="관리자 | 공지 관리"
            description="공지 검색과 상태/배너/기간 필터로 노출 상태를 빠르게 판단하고 발행/중지 조치할 수 있습니다."
            actions={
              <>
                <Link className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-white" href="/mypage/admin/users">
                  사용자 관리
                </Link>
                <Link className="rounded-full bg-theme-brand px-4 py-2 text-xs font-bold text-white" href="/mypage/admin/notices/new">
                  공지 등록
                </Link>
              </>
            }
          />

          <FilterBar
            onSearch={() => {
              applyFilters({ q: keywordInput, page: 0 });
            }}
            onReset={() => {
              setKeywordInput("");
              applyFilters({ q: "", status: "ALL", banner: "ALL", fromDate: "", toDate: "", page: 0 });
            }}
          >
            <input
              className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
              placeholder="제목/내용 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters({ q: keywordInput, page: 0 });
                }
              }}
            />

            <select
              className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
              value={statusFilter}
              onChange={(event) => applyFilters({ q: keywordInput, status: event.target.value as NoticeStatusFilter, page: 0 })}
            >
              <option value="ALL">상태 전체</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>

            <select
              className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
              value={bannerFilter}
              onChange={(event) => applyFilters({ q: keywordInput, banner: event.target.value as BannerFilter, page: 0 })}
            >
              <option value="ALL">배너 전체</option>
              <option value="BANNER_ONLY">배너만</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
                type="date"
                value={fromDate}
                onChange={(event) => applyFilters({ q: keywordInput, fromDate: event.target.value, page: 0 })}
              />
              <input
                className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
                type="date"
                value={toDate}
                onChange={(event) => applyFilters({ q: keywordInput, toDate: event.target.value, page: 0 })}
              />
            </div>
          </FilterBar>

          <div className="overflow-x-auto rounded-2xl border border-warm bg-white">
            {loading ? <p className="px-6 py-8 text-sm text-theme-secondary">불러오는 중...</p> : null}
            {!loading && !visibleRows.length ? <p className="px-6 py-8 text-sm text-theme-secondary">공지사항이 없습니다.</p> : null}

            {!loading && visibleRows.length ? (
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="bg-theme text-xs text-theme-secondary">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">제목</th>
                    <th className="hidden px-4 py-3 md:table-cell">노출기간</th>
                    <th className="px-4 py-3">배너</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="hidden px-4 py-3 md:table-cell">수정일</th>
                    <th className="px-4 py-3 text-right">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm">
                  {visibleRows.map((row) => {
                    const viewStatus = resolveViewStatus(row);
                    const statusBadge = getStatusBadge(viewStatus);
                    const actionLabel = row.status === "PUBLISHED" ? "중지" : "발행";

                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-medium text-theme-brand">{row.id}</td>
                        <td className="px-4 py-3">{row.title}</td>
                        <td className="hidden px-4 py-3 text-xs md:table-cell">
                          {formatDate(row.startAt)} ~ {row.endAt ? formatDate(row.endAt) : "상시"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={row.isBanner ? "배너" : "일반"} tone={row.isBanner ? "warning" : "neutral"} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">{formatDate(row.updatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              className="rounded-md border border-warm px-3 py-1.5 text-[11px] font-bold text-theme-secondary transition-colors hover:bg-theme"
                              href={`/notices/${row.id}`}
                              target="_blank"
                            >
                              미리보기
                            </Link>
                            <Link
                              className="rounded-md border border-warm px-3 py-1.5 text-[11px] font-bold text-theme-secondary transition-colors hover:bg-theme"
                              href={`/mypage/admin/notices/${row.id}/edit`}
                            >
                              수정
                            </Link>
                            <button
                              className="rounded-md border border-warm px-3 py-1.5 text-[11px] font-bold text-theme-secondary transition-colors hover:bg-theme"
                              type="button"
                              onClick={() => requestStatusChange(row)}
                            >
                              {actionLabel}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
          </div>

          {payload ? (
            <div className="flex items-center justify-center gap-3">
              <button
                className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary disabled:opacity-50"
                type="button"
                disabled={payload.page <= 0}
                onClick={() => {
                  const nextPage = Math.max(page - 1, 0);
                  applyFilters({ q: keywordInput, page: nextPage });
                }}
              >
                이전
              </button>
              <span className="text-xs text-theme-secondary">
                {payload.page + 1} / {Math.max(payload.totalPages, 1)}
              </span>
              <button
                className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary disabled:opacity-50"
                type="button"
                disabled={payload.last}
                onClick={() => {
                  const nextPage = page + 1;
                  applyFilters({ q: keywordInput, page: nextPage });
                }}
              >
                다음
              </button>
            </div>
          ) : null}
        </div>
      </main>

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title={confirmTarget ? `공지 "${confirmTarget.title}" ${confirmTarget.actionLabel} 확인` : "상태 변경 확인"}
        description={confirmTarget ? `해당 공지를 ${confirmTarget.actionLabel} 처리하시겠습니까?` : ""}
        confirmLabel={confirmTarget?.actionLabel ?? "확인"}
        danger={confirmTarget?.nextStatus === "HIDDEN"}
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) {
            setConfirmTarget(null);
          }
        }}
        onConfirm={() => {
          void confirmStatusChange();
        }}
      />

      <ToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
