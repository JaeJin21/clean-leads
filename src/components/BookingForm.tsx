"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Building2,
  Sofa,
  LogOut,
  BedSingle,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  MapPin,
  CalendarDays,
  Ruler,
  Gift,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { insertLead } from "@/lib/leads";

// ── 타입 ─────────────────────────────────────────────────
type CleanType = "입주청소" | "퇴거청소" | "거주청소" | "원룸청소" | "사무실청소" | "특수청소" | "기타청소" | null;

interface FormData {
  cleanType: CleanType;
  size: number;
  date: string;
  name: string;
  phone: string;
  address: string;
}

// ── 상수 ─────────────────────────────────────────────────
const CLEAN_TYPES = [
  {
    id: "입주청소" as CleanType,
    icon: Home,
    label: "입주청소",
    desc: "이사 전후 새집처럼",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-600",
  },
  {
    id: "퇴거청소" as CleanType,
    icon: LogOut,
    label: "퇴거청소",
    desc: "이사 나갈 때 말끔하게",
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-300",
    text: "text-violet-600",
  },
  {
    id: "거주청소" as CleanType,
    icon: Sofa,
    label: "거주청소",
    desc: "살면서 깊은 청소",
    color: "from-sky-400 to-sky-500",
    bg: "bg-sky-50",
    border: "border-sky-300",
    text: "text-sky-600",
  },
  {
    id: "원룸청소" as CleanType,
    icon: BedSingle,
    label: "원룸청소",
    desc: "원룸·투룸 맞춤 청소",
    color: "from-teal-400 to-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-300",
    text: "text-teal-600",
  },
  {
    id: "사무실청소" as CleanType,
    icon: Building2,
    label: "사무실청소",
    desc: "쾌적한 업무 환경",
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-300",
    text: "text-indigo-600",
  },
  {
    id: "특수청소" as CleanType,
    icon: Sparkles,
    label: "특수청소",
    desc: "화재·수해·심화 오염",
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-600",
  },
  {
    id: "기타청소" as CleanType,
    icon: HelpCircle,
    label: "그 외 기타 청소",
    desc: "위에 없는 청소 문의",
    color: "from-slate-400 to-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-600",
  },
];

const STEP_LABELS = ["청소 종류", "일정 & 평수", "연락처"];

// ── 애니메이션 ────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};
const transition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

// ── 헬퍼 ─────────────────────────────────────────────────
function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

/** 숫자만 추출 후 010-XXXX-XXXX 형태로 포맷 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function fireConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  setTimeout(() => clearInterval(interval), 220 * 12);
}

// ── 에러 메시지 박스 ───────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4"
    >
      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-red-600 font-medium leading-relaxed">{message}</p>
    </motion.div>
  );
}

// ── Step 1: 청소 종류 ─────────────────────────────────────
function Step1({
  value,
  onChange,
}: {
  value: CleanType;
  onChange: (v: CleanType) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 text-center">
        어떤 청소가 필요하신가요?
      </p>
      <div className="grid grid-cols-1 gap-3">
        {CLEAN_TYPES.map((t) => {
          const Icon = t.icon;
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-4 w-full rounded-2xl border-2 px-5 py-4 transition-all duration-200 text-left ${
                selected
                  ? `${t.border} ${t.bg} shadow-md scale-[1.01]`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-sm flex-shrink-0`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-base ${selected ? t.text : "text-[#0F1F3D]"}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
              </div>
              {selected && (
                <CheckCircle size={20} className={`${t.text} flex-shrink-0`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: 평수 + 날짜 ───────────────────────────────────
function Step2({
  size,
  date,
  onSize,
  onDate,
  dateError,
}: {
  size: number;
  date: string;
  onSize: (v: number) => void;
  onDate: (v: string) => void;
  dateError: string;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateBoxClick = () => {
    const input = dateInputRef.current;
    if (!input) return;
    input.focus();
    try { input.showPicker(); } catch { /* 미지원 브라우저 폴백 */ }
  };
  return (
    <div className="space-y-6">
      {/* 평수 슬라이더 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F1F3D] mb-3">
          <Ruler size={15} className="text-[#38BDF8]" />
          평수 선택
        </label>
        <div className="bg-[#F0F8FF] rounded-2xl px-5 py-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-extrabold text-[#1A3A6B]">
              {size}
              <span className="text-base font-semibold text-slate-400 ml-1">평</span>
            </span>
            <span className="text-xs text-slate-400">
              {size <= 20
                ? "소형 (원룸·투룸)"
                : size <= 40
                  ? "중형 (3~4룸)"
                  : "대형 (5룸 이상)"}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#1A3A6B]"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>10평</span>
            <span>100평</span>
          </div>
        </div>
      </div>

      {/* 날짜 선택 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F1F3D] mb-3">
          <CalendarDays size={15} className="text-[#38BDF8]" />
          희망 날짜
        </label>
        <div
          onClick={handleDateBoxClick}
          className={`relative flex items-center gap-3 w-full border-2 rounded-2xl px-4 py-3 cursor-pointer transition-colors bg-white ${
            dateError
              ? "border-red-300"
              : "border-slate-200 hover:border-[#1A3A6B]"
          }`}
        >
          <CalendarDays size={16} className="text-[#38BDF8] flex-shrink-0" />
          <span className={`flex-1 text-sm font-medium ${date ? "text-[#0F1F3D]" : "text-slate-400"}`}>
            {date
              ? new Date(date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })
              : "날짜를 선택해주세요"}
          </span>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            min={getTodayStr()}
            onChange={(e) => onDate(e.target.value)}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
        </div>
        <AnimatePresence>
          {dateError && <ErrorBanner message={dateError} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Step 3: 연락처 ────────────────────────────────────────
function Step3({
  name,
  phone,
  address,
  onName,
  onPhone,
  onAddress,
  errors,
}: {
  name: string;
  phone: string;
  address: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onAddress: (v: string) => void;
  errors: { name?: string; phone?: string; address?: string };
}) {
  const fields = [
    {
      icon: User,
      label: "이름",
      key: "name" as const,
      value: name,
      onChange: onName,
      placeholder: "홍길동",
      type: "text",
      inputMode: undefined as React.HTMLAttributes<HTMLInputElement>["inputMode"],
    },
    {
      icon: Phone,
      label: "전화번호",
      key: "phone" as const,
      value: phone,
      onChange: (v: string) => onPhone(formatPhone(v)),
      placeholder: "010-0000-0000",
      type: "tel",
      inputMode: "tel" as React.HTMLAttributes<HTMLInputElement>["inputMode"],
    },
    {
      icon: MapPin,
      label: "상세 주소",
      key: "address" as const,
      value: address,
      onChange: onAddress,
      placeholder: "서울시 마포구 상암동 123-4",
      type: "text",
      inputMode: undefined as React.HTMLAttributes<HTMLInputElement>["inputMode"],
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 text-center">
        견적을 보내드릴 연락처를 입력해주세요
      </p>
      {fields.map(({ icon: Icon, label, key, value, onChange, placeholder, type, inputMode }) => (
        <div key={label}>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <Icon size={13} className="text-[#38BDF8]" />
            {label}
          </label>
          <input
            type={type}
            inputMode={inputMode}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-[#0F1F3D] placeholder-slate-300 focus:outline-none transition-colors ${
              errors[key]
                ? "border-red-300 focus:border-red-400 bg-red-50"
                : "border-slate-200 focus:border-[#1A3A6B] bg-white"
            }`}
          />
          <AnimatePresence>
            {errors[key] && <ErrorBanner message={errors[key]!} />}
          </AnimatePresence>
        </div>
      ))}
      <p className="text-[10px] text-slate-400 text-center pt-1">
        개인정보는 견적 연결 목적으로만 사용되며 제3자에게 제공되지 않습니다.
      </p>
    </div>
  );
}

// ── 완료 화면 ─────────────────────────────────────────────
function DoneScreen({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="text-center py-4 px-2"
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1A3A6B] to-[#38BDF8] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#1A3A6B]/30">
        <CheckCircle size={36} className="text-white" />
      </div>
      <h3 className="text-2xl font-extrabold text-[#0F1F3D] mb-2">접수 완료!</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-1">
        전문가 3곳이{" "}
        <span className="font-semibold text-[#1A3A6B]">15분 이내</span>에
        <br />
        맞춤 견적을 보내드릴게요.
      </p>
      <p className="text-xs text-[#38BDF8] font-semibold mb-6">
        🎁 2만원 할인 쿠폰이 문자로 발송됩니다.
      </p>
      <button
        onClick={onReset}
        className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 transition-colors"
      >
        처음으로 돌아가기
      </button>
    </motion.div>
  );
}

// ── 유효성 검사 ───────────────────────────────────────────
function validateStep3(name: string, phone: string, address: string) {
  const errors: { name?: string; phone?: string; address?: string } = {};
  if (!name.trim()) errors.name = "이름을 입력해주세요.";
  else if (name.trim().length < 2) errors.name = "이름은 2자 이상 입력해주세요.";

  const digits = phone.replace(/\D/g, "");
  if (!phone.trim()) errors.phone = "전화번호를 입력해주세요.";
  else if (digits.length < 10) errors.phone = "올바른 전화번호를 입력해주세요. (예: 010-1234-5678)";
  else if (!digits.startsWith("01")) errors.phone = "휴대폰 번호는 010·011로 시작해야 해요.";

  if (!address.trim()) errors.address = "상세 주소를 입력해주세요.";
  else if (address.trim().length < 5) errors.address = "주소를 더 자세히 입력해주세요.";

  return errors;
}

// ── 메인 BookingForm ──────────────────────────────────────
export default function BookingForm() {
  const formRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});
  const [dateError, setDateError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    cleanType: null,
    size: 25,
    date: "",
    name: "",
    phone: "",
    address: "",
  });

  const scrollToForm = () => {
    if (!formRef.current) return;
    const top = formRef.current.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      // 수정 시 해당 필드 에러 초기화
      if (key === "date") setDateError("");
      if (key === "name" || key === "phone" || key === "address") {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      }
      setSubmitError(null);
    },
    []
  );

  // 각 단계 다음 버튼 활성화 조건 (실시간 — 에러 없을 때만)
  const canNext = [
    formData.cleanType !== null,
    formData.date !== "",
    formData.name.trim().length >= 2 &&
      formData.phone.replace(/\D/g, "").length >= 10 &&
      formData.address.trim().length >= 5,
  ];

  const goNext = async () => {
    // Step 2 → 날짜 추가 검증
    if (step === 1) {
      if (!formData.date) {
        setDateError("희망 날짜를 선택해주세요.");
        return;
      }
      scrollToForm();
      setDir(1);
      setStep((s) => s + 1);
      return;
    }

    // Step 3 → 유효성 검사 후 Supabase INSERT
    if (step === 2) {
      const errors = validateStep3(formData.name, formData.phone, formData.address);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      setSubmitError(null);

      const result = await insertLead({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        service_type: formData.cleanType!,
        size: formData.size,
        date: formData.date,
      });

      setLoading(false);

      if (!result.success) {
        setSubmitError(result.error ?? "알 수 없는 오류가 발생했어요.");
        return;
      }

      setDone(true);
      fireConfetti();
      return;
    }

    // Step 0 → 1
    scrollToForm();
    setDir(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    scrollToForm();
    setDir(-1);
    setFieldErrors({});
    setDateError("");
    setSubmitError(null);
    setStep((s) => s - 1);
  };

  const reset = () => {
    setStep(0);
    setDir(1);
    setDone(false);
    setLoading(false);
    setSubmitError(null);
    setFieldErrors({});
    setDateError("");
    setFormData({ cleanType: null, size: 25, date: "", name: "", phone: "", address: "" });
  };

  return (
    <div ref={formRef} className="bg-white rounded-3xl shadow-2xl shadow-[#1A3A6B]/10 border border-slate-100 overflow-hidden max-w-md w-full mx-auto">
      {/* 상단 헤더 */}
      {!done && (
        <div className="bg-gradient-to-r from-[#1A3A6B] to-[#2563EB] px-6 py-5">
          {/* 스텝 인디케이터 */}
          <div className="flex items-center justify-between mb-4">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      i < step
                        ? "bg-[#38BDF8] text-white"
                        : i === step
                          ? "bg-white text-[#1A3A6B]"
                          : "bg-white/20 text-white/60"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium transition-all ${
                      i === step ? "text-white" : "text-white/50"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`h-px w-8 sm:w-12 mb-4 transition-all duration-500 ${
                      i < step ? "bg-[#38BDF8]" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 진행바 */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#38BDF8] rounded-full"
              animate={{ width: `${((step + 1) / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      {/* 폼 바디 */}
      <div className="px-6 py-6">
        {done ? (
          <DoneScreen onReset={reset} />
        ) : (
          <>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                {step === 0 && (
                  <Step1
                    value={formData.cleanType}
                    onChange={(v) => update("cleanType", v)}
                  />
                )}
                {step === 1 && (
                  <Step2
                    size={formData.size}
                    date={formData.date}
                    onSize={(v) => update("size", v)}
                    onDate={(v) => update("date", v)}
                    dateError={dateError}
                  />
                )}
                {step === 2 && (
                  <Step3
                    name={formData.name}
                    phone={formData.phone}
                    address={formData.address}
                    onName={(v) => update("name", v)}
                    onPhone={(v) => update("phone", v)}
                    onAddress={(v) => update("address", v)}
                    errors={fieldErrors}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Supabase 제출 에러 */}
            <AnimatePresence>
              {submitError && <ErrorBanner message={submitError} />}
            </AnimatePresence>

            {/* 버튼 영역 */}
            <div className="flex gap-3 mt-7">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={loading}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-500 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  이전
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext[step] || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  canNext[step] && !loading
                    ? step === 2
                      ? "bg-gradient-to-r from-[#1A3A6B] to-[#2563EB] text-white shadow-lg shadow-[#1A3A6B]/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                      : "bg-[#1A3A6B] text-white hover:bg-[#142d55] active:scale-95"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    저장 중…
                  </>
                ) : step === 2 ? (
                  <>
                    <Gift size={17} />
                    무료 견적 신청하고 2만원 할인받기
                  </>
                ) : (
                  <>
                    다음 단계
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
