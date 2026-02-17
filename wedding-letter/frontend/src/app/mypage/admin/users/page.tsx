"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { fetchAuthMe } from "@/lib/auth";
import LandingTopHeader from "@/components/LandingTopHeader";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FilterBar from "@/components/admin/FilterBar";
import StatusBadge from "@/components/admin/StatusBadge";
import { ToastViewport, useToast } from "@/components/admin/Toast";
import type { PagedResponse } from "@/types/notice";
import type { AdminUserSummary } from "@/types/user";

type RoleFilter = "ALL" | "USER" | "ADMIN";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

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

function isInDateRange(value: string | null | undefined, fromDate: string, toDate: string): boolean {
  if (!fromDate && !toDate) return true;
  if (!value) return false;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;

  if (fromDate) {
    const fromTime = new Date(`${fromDate}T00:00:00`).getTime();
    if (!Number.isNaN(fromTime) && time < fromTime) return false;
  }

  if (toDate) {
    const toTime = new Date(`${toDate}T23:59:59`).getTime();
    if (!Number.isNaN(toTime) && time > toTime) return false;
  }

  return true;
}

function AdminUsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toasts, pushToast, removeToast } = useToast();

  const [authReady, setAuthReady] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [payload, setPayload] = useState<PagedResponse<AdminUserSummary> | null>(null);
  const [loading, setLoading] = useState(true);

  const visibleRows = useMemo(() => {
    const rows = payload?.content ?? [];
    return rows.filter((row) => {
      if (roleFilter !== "ALL" && row.role !== roleFilter) {
        return false;
      }

      if (activeFilter !== "ALL") {
        const activeTarget = activeFilter === "ACTIVE";
        if (row.isActive !== activeTarget) {
          return false;
        }
      }

      if (!isInDateRange(row.createdAt, fromDate, toDate)) {
        return false;
      }

      return true;
    });
  }, [payload, roleFilter, activeFilter, fromDate, toDate]);

  const syncUrl = (next: {
    q: string;
    role: RoleFilter;
    active: ActiveFilter;
    fromDate: string;
    toDate: string;
    page: number;
  }) => {
    const params = new URLSearchParams();

    if (next.q) params.set("q", next.q);
    if (next.role !== "ALL") params.set("role", next.role);
    if (next.active !== "ALL") params.set("active", next.active);
    if (next.fromDate) params.set("from", next.fromDate);
    if (next.toDate) params.set("to", next.toDate);
    if (next.page > 0) params.set("page", String(next.page));

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const applyFilters = (next: Partial<{ q: string; role: RoleFilter; active: ActiveFilter; fromDate: string; toDate: string; page: number }> = {}) => {
    const applied = {
      q: (next.q ?? keyword).trim(),
      role: next.role ?? roleFilter,
      active: next.active ?? activeFilter,
      fromDate: next.fromDate ?? fromDate,
      toDate: next.toDate ?? toDate,
      page: next.page ?? page,
    };

    setKeyword(applied.q);
    setRoleFilter(applied.role);
    setActiveFilter(applied.active);
    setFromDate(applied.fromDate);
    setToDate(applied.toDate);
    setPage(applied.page);

    syncUrl(applied);
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
    const role = (searchParams.get("role") as RoleFilter | null) ?? "ALL";
    const active = (searchParams.get("active") as ActiveFilter | null) ?? "ALL";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const nextPage = parsePage(searchParams.get("page"));

    setKeywordInput(q);
    setKeyword(q);
    setRoleFilter(role === "USER" || role === "ADMIN" ? role : "ALL");
    setActiveFilter(active === "ACTIVE" || active === "INACTIVE" ? active : "ALL");
    setFromDate(from);
    setToDate(to);
    setPage(nextPage);
  }, [searchParams]);

  useEffect(() => {
    if (!authReady) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          size: "20",
        });

        if (keyword.trim()) {
          query.set("keyword", keyword.trim());
        }

        if (roleFilter !== "ALL") {
          query.set("role", roleFilter);
        }

        if (activeFilter !== "ALL") {
          query.set("isActive", activeFilter === "ACTIVE" ? "true" : "false");
        }

        const data = await apiFetch<PagedResponse<AdminUserSummary>>(`/api/admin/users?${query.toString()}`, {
          cache: "no-store",
        });

        setPayload(data);
      } catch {
        setPayload(null);
        pushToast("사용자 목록을 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [authReady, keyword, roleFilter, activeFilter, page, pushToast]);

  return (
    <div className="min-h-screen bg-theme">
      <LandingTopHeader />

      <main className="px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-5">
          <AdminPageHeader
            title="관리자 | 사용자 목록"
            description="사용자 검색, 권한/상태 확인, 사용자별 청첩장 관리로 이동할 수 있습니다."
            actions={
              <>
                <Link className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-white" href="/mypage">
                  마이페이지
                </Link>
                <Link className="rounded-full border border-warm px-4 py-2 text-xs font-bold text-theme-secondary hover:bg-white" href="/mypage/admin/notices">
                  공지 관리
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
              applyFilters({ q: "", role: "ALL", active: "ALL", fromDate: "", toDate: "", page: 0 });
            }}
          >
            <input
              className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
              placeholder="이메일/이름/userId로 검색"
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
              value={roleFilter}
              onChange={(event) => applyFilters({ q: keywordInput, role: event.target.value as RoleFilter, page: 0 })}
            >
              <option value="ALL">권한 전체</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <select
              className="h-10 w-full rounded-xl border border-warm px-3 text-sm outline-none"
              value={activeFilter}
              onChange={(event) => applyFilters({ q: keywordInput, active: event.target.value as ActiveFilter, page: 0 })}
            >
              <option value="ALL">상태 전체</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
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
            {!loading && !visibleRows.length ? <p className="px-6 py-8 text-sm text-theme-secondary">데이터가 없습니다.</p> : null}

            {!loading && visibleRows.length ? (
              <table className="min-w-[860px] w-full text-left text-sm">
                <thead className="bg-theme text-xs text-theme-secondary">
                  <tr>
                    <th className="px-4 py-3">userId</th>
                    <th className="px-4 py-3">이름</th>
                    <th className="px-4 py-3">이메일</th>
                    <th className="px-4 py-3">권한</th>
                    <th className="hidden px-4 py-3 md:table-cell">가입일</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3 text-right">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm">
                  {visibleRows.map((row) => (
                    <tr key={row.userId}>
                      <td className="px-4 py-3 font-medium text-theme-brand">{row.userId}</td>
                      <td className="px-4 py-3">{row.name ?? "-"}</td>
                      <td className="px-4 py-3">{row.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={row.role} tone={row.role === "ADMIN" ? "warning" : "info"} />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={row.isActive ? "활성" : "비활성"} tone={row.isActive ? "success" : "danger"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className="rounded-lg border border-warm px-3 py-1.5 text-xs font-bold text-theme-secondary transition-colors hover:bg-theme"
                          href={`/mypage/admin/users/${encodeURIComponent(row.userId)}/invitations?name=${encodeURIComponent(row.name ?? "")}`}
                        >
                          청첩장 관리
                        </Link>
                      </td>
                    </tr>
                  ))}
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

      <ToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-theme px-6 py-10 text-sm text-theme-secondary">페이지 로딩 중...</div>}>
      <AdminUsersPageContent />
    </Suspense>
  );
}
