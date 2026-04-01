import {
  ArrowRight,
  Star,
  CheckCircle2,
  ClipboardList,
  Users,
  BadgeCheck,
  Phone,
  Shield,
  Sparkles,
} from "lucide-react";
import BookingForm from "@/components/BookingForm";

// ── 데이터 ────────────────────────────────────────────────
const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "간단 신청",
    desc: "청소 종류·날짜·평수를 30초 안에 입력하세요. 회원가입 없이 무료로 신청할 수 있어요.",
  },
  {
    icon: Users,
    step: "02",
    title: "전문가 매칭",
    desc: "인근 검증된 청소 전문가 최대 3곳이 맞춤 견적을 보내드려요.",
  },
  {
    icon: BadgeCheck,
    step: "03",
    title: "확정 & 완료",
    desc: "가격·후기·보험 여부를 비교하고 가장 마음에 드는 곳을 선택하세요.",
  },
];

const reviews = [
  {
    name: "김지수",
    location: "서울 마포구",
    rating: 5,
    text: "이사 후 입주청소를 맡겼는데 정말 깨끗하게 해주셨어요. 3곳 견적을 한 번에 받아서 비교하니 훨씬 편했어요!",
    service: "입주 청소",
  },
  {
    name: "박민준",
    location: "경기 성남시",
    rating: 5,
    text: "에어컨 청소를 맡겼는데 가격이 합리적이고 작업이 꼼꼼했어요. 다음에도 무조건 여기서 신청할 거예요.",
    service: "에어컨 청소",
  },
  {
    name: "이수빈",
    location: "부산 해운대구",
    rating: 5,
    text: "사무실 정기 청소 업체를 찾고 있었는데 딱 맞는 곳을 연결해줬어요. 직원들 만족도도 높아졌어요.",
    service: "사무실 청소",
  },
];

const badges = [
  { icon: Shield, label: "보험 가입 업체 인증" },
  { icon: Star, label: "평균 만족도 4.9점" },
  { icon: CheckCircle2, label: "누적 매칭 12,000건+" },
  { icon: Sparkles, label: "100% 무료 견적 비교" },
];

// ── 컴포넌트 ──────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-[#1A3A6B] font-bold text-lg tracking-tight">
            청소매칭
          </span>
          <a
            href="#booking"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#1A3A6B] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#142d55] transition-colors"
          >
            무료 견적 신청 <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EBF4FF] via-white to-[#F0F8FF] pt-20 pb-24 px-6">
        {/* 배경 블러 원 */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#3B82F6]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#1A3A6B]/[0.08] blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block mb-4 px-3.5 py-1 bg-[#DBEAFE] text-[#1A3A6B] text-xs font-semibold rounded-full tracking-wide uppercase">
            100% 무료 · 회원가입 불필요
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F1F3D] leading-tight tracking-tight">
            우리 동네 숨은{" "}
            <span className="text-[#38BDF8]">청소 고수</span>,<br />
            30초 만에 무료 견적 비교
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            입주청소·에어컨청소·사무실청소까지 — 검증된 전문가 3곳의 견적을
            한 번에 받아보세요. 비교하고 선택하면 끝!
          </p>

          <div
            id="cta"
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-[#1A3A6B] text-white font-semibold text-base px-8 py-4 rounded-2xl shadow-lg shadow-[#1A3A6B]/30 hover:bg-[#142d55] hover:shadow-xl transition-all duration-200 active:scale-95"
            >
              <Sparkles size={18} />
              무료 견적 신청하기
            </a>
            <a
              href="#steps"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-medium text-base px-8 py-4 rounded-2xl hover:border-[#38BDF8] hover:text-[#1A3A6B] transition-all duration-200"
            >
              이용 방법 보기 <ArrowRight size={16} />
            </a>
          </div>

          {/* 신뢰 배지 */}
          <ul className="mt-10 flex flex-wrap justify-center gap-4">
            {badges.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"
              >
                <Icon size={14} className="text-[#38BDF8]" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Booking Form ── */}
      <section id="booking" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-[#38BDF8] uppercase tracking-widest mb-2">
              Free Estimate
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1F3D]">
              30초 만에 무료 견적 신청
            </h2>
            <p className="mt-3 text-slate-500 text-sm">
              지금 신청하면 <span className="text-[#1A3A6B] font-semibold">2만원 할인 쿠폰</span>을 즉시 드려요.
            </p>
          </div>
          <BookingForm />
        </div>
      </section>

      {/* ── Steps ── */}
      <section id="steps" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#38BDF8] uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1F3D]">
              신청부터 완료까지 3단계
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, step, title, desc }) => (
              <div
                key={step}
                className="relative bg-[#F8FAFF] border border-slate-100 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="absolute top-6 right-6 text-5xl font-black text-[#DBEAFE] select-none leading-none">
                  {step}
                </span>
                <div className="w-12 h-12 rounded-xl bg-[#1A3A6B] flex items-center justify-center mb-5 shadow-md shadow-[#1A3A6B]/20">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1F3D] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#F0F8FF] to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#38BDF8] uppercase tracking-widest mb-2">
              Real Reviews
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1F3D]">
              실제 이용 고객 후기
            </h2>
            <p className="mt-3 text-slate-500 text-sm">
              12,000명이 넘는 고객이 청소매칭을 통해 전문가를 만났어요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                {/* 별점 */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  &ldquo;{r.text}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-xs font-bold">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F1F3D]">
                        {r.name}
                      </p>
                      <p className="text-xs text-slate-400">{r.location}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#38BDF8] font-medium bg-[#EBF4FF] px-2.5 py-1 rounded-full">
                    {r.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6 bg-[#1A3A6B]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            지금 바로 무료 견적을
            <br />
            받아보세요
          </h2>
          <p className="mt-4 text-[#93C5FD] text-base">
            평균 응답 시간 15분 이내 · 부담 없이 비교만 해도 OK
          </p>
          <a
            href="#"
            className="mt-8 inline-flex items-center gap-2 bg-[#38BDF8] text-[#0F1F3D] font-bold text-base px-9 py-4 rounded-2xl hover:bg-[#7DD3FA] transition-colors duration-200 shadow-lg shadow-[#38BDF8]/30 active:scale-95"
          >
            <Phone size={18} />
            무료 견적 신청하기
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0F1F3D] text-slate-500 text-xs py-8 px-6 text-center">
        <p className="font-semibold text-slate-300 mb-1">청소매칭</p>
        <p>© 2025 CleanMatch. All rights reserved.</p>
        <p className="mt-1">
          사업자등록번호: 000-00-00000 · 대표: 홍길동 · 고객센터: 02-0000-0000
        </p>
      </footer>
    </main>
  );
}
