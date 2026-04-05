"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Lock,
  RefreshCw,
  TrendingUp,
  CalendarDays,
  User,
  Phone,
  MapPin,
  Ruler,
  Tag,
  CheckCircle2,
  Clock,
  Trash2,
  BarChart2,
  List,
} from "lucide-react";

// ── 타입 ──────────────────────────────────────────────────
interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  service_type: string;
  size: number;
  date: string;
  status: string;
  created_at: string;
  ref_channel: string | null;
}

type Tab = "leads" | "stats";
type DateFilter = "today" | "week" | "month";

// ── 상수 ──────────────────────────────────────────────────
const REVENUE_PER_LEAD = 20000;
const CONVERTED = new Set(["matched", "completed"]);

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  matched: "업체 전송 완료",
  completed: "완료",
  cancelled: "취소",
};

const SERVICE_COLOR: Record<string, string> = {
  입주청소: "bg-blue-100 text-blue-700",
  퇴거청소: "bg-violet-100 text-violet-700",
  거주청소: "bg-sky-100 text-sky-700",
  원룸청소: "bg-teal-100 text-teal-700",
  사무실청소: "bg-indigo-100 text-indigo-700",
  특수청소: "bg-orange-100 text-orange-700",
  기타청소: "bg-slate-100 text-slate-600",
};

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
];

// ── 헬퍼 ──────────────────────────────────────────────────
function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRangeStart(filter: DateFilter): Date {
  const now = new Date();
  if (filter === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (filter === "week") {
    const diff = now.getDay() === 0 ? 6 : now.getDay() - 1; // 월요일 기준
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ── 비밀번호 화면 ──────────────────────────────────────────
function LoginGate({ onSuccess }: { onSuccess: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = async () => {
    const res = await fetch("/api/admin/leads", {
      headers: { "x-admin-token": pw },
    });
    if (res.ok) {
      onSuccess(pw);
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1A3A6B] flex items-center justify-center mx-auto mb-5">
          <Lock size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-extrabold text-[#0F1F3D] mb-1">관리자 로그인</h1>
        <p className="text-sm text-slate-400 mb-7">비밀번호를 입력해주세요</p>

        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="비밀번호"
          className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none transition-colors ${
            error ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-[#1A3A6B]"
          }`}
        />
        {error && <p className="text-xs text-red-500 mt-2">비밀번호가 틀렸습니다.</p>}

        <button
          onClick={submit}
          className="mt-5 w-full bg-[#1A3A6B] text-white font-bold py-3 rounded-xl hover:bg-[#142d55] transition-colors"
        >
          입장
        </button>
      </div>
    </div>
  );
}

// ── 리드 카드 ──────────────────────────────────────────────
function LeadCard({
  lead,
  token,
  onUpdate,
  onDelete,
}: {
  lead: Lead;
  token: string;
  onUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMatched = lead.status === "matched";

  const toggle = async () => {
    setToggling(true);
    const nextStatus = isMatched ? "pending" : "matched";
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id: lead.id, status: nextStatus }),
    });
    onUpdate(lead.id, nextStatus);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!confirm(`"${lead.name}" 리드를 삭제할까요?`)) return;
    setDeleting(true);
    await fetch("/api/admin/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id: lead.id }),
    });
    onDelete(lead.id);
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md ${
      isMatched ? "border-emerald-200" : "border-slate-100"
    }`}>
      <div className={`flex items-center justify-between px-5 py-3 rounded-t-2xl ${
        isMatched ? "bg-emerald-50" : "bg-slate-50"
      }`}>
        <div className="flex items-center gap-2">
          {isMatched
            ? <CheckCircle2 size={15} className="text-emerald-500" />
            : <Clock size={15} className="text-slate-400" />
          }
          <span className={`text-xs font-semibold ${isMatched ? "text-emerald-600" : "text-slate-500"}`}>
            {STATUS_LABEL[lead.status] ?? lead.status}
          </span>
        </div>
        <span className="text-xs text-slate-400">{fmt(lead.created_at)}</span>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            SERVICE_COLOR[lead.service_type] ?? "bg-slate-100 text-slate-600"
          }`}>
            {lead.service_type}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Ruler size={12} className="text-[#38BDF8]" />
            {lead.size}평
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays size={12} className="text-[#38BDF8]" />
            {new Date(lead.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
          </span>
          {lead.ref_channel && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {lead.ref_channel}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm text-[#0F1F3D] font-semibold">
            <User size={13} className="text-slate-400 flex-shrink-0" />
            {lead.name}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={13} className="text-slate-400 flex-shrink-0" />
            {lead.phone}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={13} className="text-slate-400 flex-shrink-0" />
            {lead.address}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">업체 전송 완료</span>
          <button
            onClick={toggle}
            disabled={toggling}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
              isMatched ? "bg-emerald-500" : "bg-slate-200"
            } ${toggling ? "opacity-60" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                isMatched ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={13} />
          삭제
        </button>
      </div>
    </div>
  );
}

// ── 채널 분석 탭 ──────────────────────────────────────────
function StatsTab({ leads }: { leads: Lead[] }) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");

  const tableData = useMemo(() => {
    const rangeStart = getRangeStart(dateFilter);
    const filtered = leads.filter((l) => new Date(l.created_at) >= rangeStart);

    const map = new Map<string, { total: number; converted: number }>();
    for (const l of filtered) {
      const ch = l.ref_channel ?? "direct";
      if (!map.has(ch)) map.set(ch, { total: 0, converted: 0 });
      const entry = map.get(ch)!;
      entry.total += 1;
      if (CONVERTED.has(l.status)) entry.converted += 1;
    }

    return Array.from(map.entries())
      .map(([channel, { total, converted }]) => ({
        channel,
        total,
        converted,
        rate: total > 0 ? Math.round((converted / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads, dateFilter]);

  const grandTotal = tableData.reduce((s, r) => s + r.total, 0);
  const grandConverted = tableData.reduce((s, r) => s + r.converted, 0);
  const grandRate = grandTotal > 0 ? Math.round((grandConverted / grandTotal) * 100) : 0;

  return (
    <div>
      {/* 날짜 필터 */}
      <div className="flex gap-2 mb-6">
        {DATE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              dateFilter === key
                ? "bg-[#1A3A6B] text-white shadow-md"
                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                채널
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                총 유입수
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                전환(리드) 수
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                전환율
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-slate-400 text-sm">
                  해당 기간에 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              tableData.map((row, i) => (
                <tr
                  key={row.channel}
                  className={`hover:bg-slate-50 transition-colors ${
                    i < tableData.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8] flex-shrink-0" />
                      <span className="font-semibold text-[#0F1F3D]">{row.channel}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-slate-700">
                    {row.total.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-emerald-600">
                    {row.converted.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        row.rate >= 50
                          ? "bg-emerald-100 text-emerald-700"
                          : row.rate >= 20
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.rate}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {tableData.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  합계
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-[#0F1F3D]">
                  {grandTotal.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                  {grandConverted.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-right text-xs font-bold text-slate-600">
                  {grandRate}%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">
        전환 기준: 업체 전송 완료(matched) 또는 완료(completed) 상태
      </p>
    </div>
  );
}

// ── 메인 어드민 페이지 ────────────────────────────────────
export default function AdminLeadsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("leads");

  const fetchLeads = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/leads", {
      headers: { "x-admin-token": pw },
    });
    if (res.ok) {
      setLeads(await res.json());
      setLastFetched(new Date());
    }
    setLoading(false);
  }, []);

  const handleLogin = (pw: string) => {
    setToken(pw);
    fetchLeads(pw);
  };

  const handleUpdate = (id: string, status: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const handleDelete = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchLeads(token), 30000);
    return () => clearInterval(id);
  }, [token, fetchLeads]);

  if (!token) return <LoginGate onSuccess={handleLogin} />;

  const todayLeads = leads.filter((l) => isToday(l.created_at));
  const monthMatched = leads.filter(
    (l) => isThisMonth(l.created_at) && l.status === "matched"
  );
  const monthRevenue = monthMatched.length * REVENUE_PER_LEAD;

  return (
    <div className="min-h-screen bg-[#F0F8FF]">
      {/* 헤더 */}
      <header className="bg-[#1A3A6B] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-lg tracking-tight">청소매칭 관리자</h1>
          <p className="text-xs text-blue-300 mt-0.5">
            {lastFetched ? `마지막 업데이트: ${lastFetched.toLocaleTimeString("ko-KR")}` : ""}
          </p>
        </div>
        <button
          onClick={() => fetchLeads(token)}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={15} className="text-[#38BDF8]" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">오늘 리드</span>
            </div>
            <p className="text-3xl font-extrabold text-[#0F1F3D]">
              {todayLeads.length}
              <span className="text-base font-semibold text-slate-400 ml-1">건</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-emerald-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이번 달 예상 수익</span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">
              {monthRevenue.toLocaleString()}
              <span className="text-base font-semibold text-slate-400 ml-1">원</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              전송 완료 {monthMatched.length}건 × 2만원
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-fit">
          <button
            onClick={() => setTab("leads")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "leads"
                ? "bg-[#1A3A6B] text-white shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List size={15} />
            리드 목록
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === "leads" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {leads.length}
            </span>
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "stats"
                ? "bg-[#1A3A6B] text-white shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart2 size={15} />
            채널 분석
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        {tab === "leads" ? (
          loading && leads.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">불러오는 중...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">아직 리드가 없습니다.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} token={token} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )
        ) : (
          <StatsTab leads={leads} />
        )}
      </main>
    </div>
  );
}
