export default function RsvpAdminPage() {
  return (
    <div className="min-h-screen bg-theme text-theme-primary">
      <main className="mx-auto max-w-6xl px-8 py-16">
        <header className="mb-16 flex items-end justify-between">
          <div className="space-y-2">
            <h1 className="serif-font text-3xl font-semibold">RSVP 관리</h1>
            <p className="text-sm font-light text-gray-400">하객분들의 소중한 응답을 확인하세요.</p>
          </div>
          <button
            className="flex items-center gap-2 rounded-full border border-warm bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            명단 다운로드 (CSV)
          </button>
        </header>

        <div className="mb-12 grid grid-cols-4 gap-6">
          <div className="stat-card space-y-2">
            <p className="text-[10px] tracking-widest font-bold text-gray-400 uppercase">Total Responses</p>
            <p className="serif-font text-3xl">156</p>
          </div>
          <div className="stat-card space-y-2">
            <p className="text-[10px] tracking-widest font-bold text-gray-400 uppercase">Attending</p>
            <p className="serif-font text-3xl text-theme-accent">142</p>
          </div>
          <div className="stat-card space-y-2">
            <p className="text-[10px] tracking-widest font-bold text-gray-400 uppercase">Declined</p>
            <p className="serif-font text-3xl">14</p>
          </div>
          <div className="stat-card space-y-2">
            <p className="text-[10px] tracking-widest font-bold text-gray-400 uppercase">Meal Preference</p>
            <p className="serif-font text-3xl">128</p>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <button className="rounded-full bg-theme-brand px-5 py-2 text-xs font-bold text-white" type="button">
              전체보기
            </button>
            <button className="rounded-full border border-warm bg-white px-5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50" type="button">
              참석
            </button>
            <button className="rounded-full border border-warm bg-white px-5 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50" type="button">
              미참석
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-gray-400">search</span>
            <input
              className="w-64 rounded-full border border-warm bg-white py-2 pr-4 pl-10 text-sm font-light focus:border-[var(--theme-accent)] focus:outline-none"
              placeholder="이름 검색"
              type="text"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-warm bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-warm bg-gray-50/50 text-[10px] tracking-[0.15em] font-bold text-gray-400 uppercase">
                <th className="px-8 py-5">하객 성함</th>
                <th className="px-8 py-5">참석 여부</th>
                <th className="px-8 py-5">동반 인원</th>
                <th className="px-8 py-5">식사 신청</th>
                <th className="px-8 py-5 text-right">응답 일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-divider)] text-sm font-light">
              <tr className="transition-colors hover:bg-[#faf6f1]">
                <td className="px-8 py-6 font-medium">김지민</td>
                <td className="px-8 py-6">
                  <span className="rounded bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 uppercase">Attending</span>
                </td>
                <td className="px-8 py-6">본인 외 1명</td>
                <td className="px-8 py-6">희망함</td>
                <td className="px-8 py-6 text-right text-xs text-gray-400">2024.03.20 14:22</td>
              </tr>
              <tr className="transition-colors hover:bg-[#faf6f1]">
                <td className="px-8 py-6 font-medium">이선아</td>
                <td className="px-8 py-6">
                  <span className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-400 uppercase">Declined</span>
                </td>
                <td className="px-8 py-6">-</td>
                <td className="px-8 py-6">희망안함</td>
                <td className="px-8 py-6 text-right text-xs text-gray-400">2024.03.19 18:45</td>
              </tr>
              <tr className="transition-colors hover:bg-[#faf6f1]">
                <td className="px-8 py-6 font-medium">박민수</td>
                <td className="px-8 py-6">
                  <span className="rounded bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 uppercase">Attending</span>
                </td>
                <td className="px-8 py-6">본인</td>
                <td className="px-8 py-6">희망함</td>
                <td className="px-8 py-6 text-right text-xs text-gray-400">2024.03.20 11:05</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
