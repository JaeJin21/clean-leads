# 청소매칭 리드 마케팅 사이트 — 작업 워크플로우

## 프로젝트 개요

청소 서비스 업체 매칭 플랫폼의 **리드 수집 마케팅 랜딩 페이지**.
사용자가 청소 견적을 신청하면 Supabase `leads` 테이블에 저장되고,
이후 관리자가 업체를 매칭하는 구조.

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| 백엔드 | Supabase (PostgreSQL + RLS) |
| 배포 | Vercel (자동 배포) |

---

## 전체 흐름 요약

```
[사용자] 랜딩 페이지 방문 (?ref=blog 등 UTM 파라미터 포함 가능)
    ↓
[RefChannelTracker] layout.tsx에서 ?ref= 읽어 localStorage("ref_channel")에 저장
  - ?ref= 있으면 덮어쓰기 / 없으면 기존 값 유지
    ↓
[랜딩 페이지] Hero / Steps / CTA 섹션 — 견적 신청 유도
    ↓
[BookingForm] 3단계 폼 입력
  Step 1: 청소 종류 선택
  Step 2: 평수 슬라이더 + 희망 날짜
  Step 3: 이름 / 전화번호 / 주소
    ↓
[insertLead()] localStorage에서 ref_channel 읽어 포함 (없으면 "direct")
    ↓
[Supabase DB] public.leads 테이블에 저장 (status: "pending", ref_channel 포함)
    ↓
[관리자 대시보드] /admin/leads
  - 비밀번호 로그인 (API 응답으로 검증)
  - [리드 목록 탭] 리드 카드 목록 확인 (ref_channel 배지 표시)
    - "업체 전송 완료" 토글 → status: "matched"
    - 불필요한 리드 삭제
  - [채널 분석 탭] ref_channel별 집계
    - 날짜 필터: 오늘 / 이번 주 / 이번 달
    - 채널 / 총 유입수 / 전환 수 / 전환율(%) 테이블
```

---

## 각 단계 상세 설명

### 1. 랜딩 페이지 (`src/app/page.tsx`)

사용자가 처음 진입하는 페이지. 전체 레이아웃은 다음 순서로 구성된다.

#### Header (sticky)
- 상단 고정 네비게이션. `청소매칭` 로고 + `무료 견적 신청` 버튼.
- 버튼 클릭 시 `#booking` 섹션으로 부드럽게 스크롤.

#### Hero 섹션
- 그라디언트 배경(파란 계열), 배경 블러 원 장식.
- 헤드카피: _"우리 동네 숨은 청소 고수, 30초 만에 무료 견적 비교"_
- 두 개의 CTA 버튼: `무료 견적 신청하기` (#booking 앵커) / `이용 방법 보기` (#steps 앵커).
- 신뢰 배지: 별점 아이콘 + "만족도 4.9점을 목표로 꼼꼼하게 관리합니다".

#### Booking Form 섹션 (`#booking`)
- `<BookingForm />` 컴포넌트를 삽입. 섹션 헤더에 "첫 예약 1만원 할인" 혜택 문구 표시.

#### How it works 섹션 (`#steps`)
- 3단계 이용 방법 카드 (간단 신청 → 전문가 매칭 → 확정 & 완료).

#### CTA 배너
- 진한 네이비 배경, 하단 재유도용 견적 신청 버튼.

#### Footer
- 사업자 정보 (등록번호, 대표자, 고객센터).

---

### 2. UTM 채널 추적 (`src/components/RefChannelTracker.tsx`)

`"use client"` 컴포넌트. `layout.tsx`에 삽입되어 모든 페이지 진입 시 실행.

- URL `?ref=` 파라미터가 있으면 `localStorage.setItem("ref_channel", ref)` — 덮어쓰기
- `?ref=` 없으면 기존 localStorage 값 유지
- 렌더링 결과물 없음 (`return null`)

```
예시 URL: /landing?ref=threads
  → localStorage["ref_channel"] = "threads"

예시 URL: /landing (파라미터 없음)
  → localStorage 변경 없음 (이전 값 유지)
```

---

### 3. BookingForm 컴포넌트 (`src/components/BookingForm.tsx`)

`"use client"` 클라이언트 컴포넌트. Framer Motion의 `AnimatePresence`로 스텝 전환 시 좌우 슬라이드 애니메이션 적용.

#### 상태 구조

```ts
formData = {
  cleanType: CleanType | null,  // Step 1
  size: number,                 // Step 2 (기본값 25평)
  date: string,                 // Step 2 (YYYY-MM-DD)
  name: string,                 // Step 3
  phone: string,                // Step 3
  address: string,              // Step 3
}
step: 0 | 1 | 2        // 현재 스텝
dir: 1 | -1            // 슬라이드 방향 (앞으로/뒤로)
done: boolean          // 제출 완료 여부
loading: boolean       // Supabase INSERT 중
submitError: string    // INSERT 실패 메시지
fieldErrors: {}        // Step 3 필드별 유효성 오류
dateError: string      // Step 2 날짜 미선택 오류
```

#### Step 1 — 청소 종류 선택
- 6개 옵션 버튼: 입주청소 / 퇴거청소 / 거주청소 / 사무실청소 / 특수청소 / 기타청소.
- 선택 즉시 `formData.cleanType` 업데이트. 선택된 카드는 컬러 테두리 + 체크 아이콘.
- `canNext[0] = cleanType !== null` → 선택해야 다음 버튼 활성화.

#### Step 2 — 평수 + 날짜
- **평수 슬라이더**: `range` input, 10~100평, 1평 단위. 현재 값에 따라 "소형/중형/대형" 레이블 표시.
- **날짜 선택**: 박스 전체 클릭 시 숨겨진 `<input type="date">`의 `showPicker()` 호출 → 브라우저 캘린더 팝업. 선택 후 "2025년 5월 10일 (토)" 형태로 표시.
- `min` 속성으로 오늘 이전 날짜 선택 불가.
- `canNext[1] = date !== ""` → 날짜 선택해야 다음 버튼 활성화.

#### Step 3 — 연락처 입력
- 이름 / 전화번호 / 주소 세 개 필드.
- **전화번호 자동 포맷**: `formatPhone()` 함수로 입력 즉시 `010-XXXX-XXXX` 형태로 변환 (숫자만 추출 후 자리수별 슬라이스).
- `canNext[2]`: 이름 2자↑ + 전화번호 10자리↑ + 주소 5자↑ 동시 충족 시 버튼 활성화.
- 개인정보 고지 문구 ("견적 연결 목적으로만 사용") 하단 표시.

#### 다음 버튼 (`goNext`) 로직

```
Step 0 → 1: cleanType 선택 확인 → 스텝 전환
Step 1 → 2: date 비어있으면 dateError 세팅 후 중단 → 정상이면 스텝 전환
Step 2 → 완료:
  1. validateStep3() 실행 → 오류 있으면 fieldErrors 세팅 후 중단
  2. setLoading(true)
  3. insertLead(formData) 호출 (비동기)
  4. 실패 → submitError 표시
  5. 성공 → setDone(true) + fireConfetti() + 폼 위치로 스크롤
```

#### 완료 화면 (`DoneScreen`)
- 체크 아이콘 + "접수 완료!" 메시지.
- confetti 애니메이션이 좌우에서 터짐 (canvas-confetti, 약 2.6초간).
- "처음으로 돌아가기" 버튼으로 `reset()` 호출 → 모든 상태 초기화.

---

### 4. Supabase 클라이언트 (`src/lib/supabase.ts`)

```ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

- `anon` 키 사용 → RLS 정책에 따라 INSERT 전용 권한.
- 환경변수 누락 시 모듈 로드 시점에 `Error` throw → 배포 전 누락 즉시 감지.

---

### 5. 리드 저장 함수 (`src/lib/leads.ts`)

```
insertLead(payload) 호출
  ↓
supabase.from("leads").insert({ ...payload, status: "pending" })
  ↓
성공 → { success: true }
실패 →
  23505 (unique 중복): "이미 동일한 번호로 신청된 내역이 있어요."
  42501 (RLS 권한 없음): "접근 권한이 없어요."
  기타 Supabase 에러: "저장 중 오류가 발생했어요."
  네트워크 오류 (catch): "네트워크 오류가 발생했어요."
```

- 반환 타입 `{ success: boolean; error?: string }` — 컴포넌트에서 분기 처리.
- 모든 문자열 필드는 `trim()` 후 저장.

---

### 6. Supabase DB 스키마 (`supabase/leads_schema.sql`)

#### `public.leads` 테이블 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | 자동 생성 |
| `name` | text | 고객 이름 |
| `phone` | text | 전화번호 |
| `address` | text | 상세 주소 |
| `service_type` | text | 청소 종류 |
| `size` | int | 평수 |
| `date` | date | 희망 날짜 |
| `status` | text | pending / matched / completed / cancelled |
| `created_at` | timestamptz | 접수 일시 (기본값: now()) |
| `ref_channel` | text (nullable) | 유입 채널: blog / threads / daangn / direct / x |

#### RLS 정책
- `anon` 역할: **INSERT 전용** (조회/수정/삭제 불가 → 고객이 타인 데이터 접근 불가)
- `service_role`: **전체 권한** (관리자 API에서만 사용)

#### 인덱스
- `status` 컬럼 (상태별 조회 최적화)
- `created_at DESC` (최신순 정렬 최적화)

---

### 7. 관리자 API (`src/app/api/admin/leads/route.ts`)

Next.js Route Handler (서버 사이드). `service_role` 클라이언트로 RLS를 우회해 전체 데이터 접근.

#### 인증 방식 (`isAuthorized`)

```
요청 헤더: x-admin-token: <비밀번호>
  ↓
ADMIN_PASSWORD 환경변수 미설정 → 500 응답 (설정 누락 명시)
token !== ADMIN_PASSWORD      → 401 Unauthorized
token === ADMIN_PASSWORD      → 통과
```

비밀번호는 `.env.local` / Vercel 환경변수에만 존재. 코드 어디에도 하드코딩 없음.

#### 엔드포인트

| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/admin/leads` | 전체 리드 최신순 조회 |
| PATCH | `/api/admin/leads` | `{ id, status }` 받아 status 업데이트 |
| DELETE | `/api/admin/leads` | `{ id }` 받아 DB에서 완전 삭제 |

---

### 8. 관리자 대시보드 (`src/app/admin/leads/page.tsx`)

`"use client"` 컴포넌트. `/admin/leads` 경로로 접근.

#### 로그인 흐름 (`LoginGate`)

```
비밀번호 입력 → GET /api/admin/leads (x-admin-token 헤더 포함)
  200 OK    → token 상태 저장 + fetchLeads() 호출
  401       → "비밀번호가 틀렸습니다." 에러 표시
```

코드에 비밀번호 문자열 없음. API 응답으로만 인증 여부 판단.

#### 상단 요약 카드

```
오늘 리드 수:
  leads.filter(l => isToday(l.created_at)).length

이번 달 예상 수익:
  leads.filter(l => isThisMonth(l.created_at) && l.status === "matched").length
  × 20,000원
```

#### 탭 구성

**[리드 목록 탭]** (기존)
- 전체 리드 카드 그리드 표시
- 리드 수 뱃지 실시간 표시

**[채널 분석 탭]** (신규)
- 날짜 필터: 오늘 / 이번 주(월요일 기준) / 이번 달
- `leads` 데이터를 클라이언트에서 `ref_channel`별로 집계 (추가 API 호출 없음)
- 테이블 컬럼: 채널 / 총 유입수 / 전환(리드) 수 / 전환율(%)
- 전환 기준: `status = "matched"` 또는 `"completed"`
- 전환율 색상: 50%↑ 초록 / 20%↑ 주황 / 그 외 회색
- 합계 행 자동 표시

#### 리드 카드 (`LeadCard`)
- 서비스 종류 컬러 배지 (입주=파랑, 퇴거=보라, 거주=스카이, 사무실=인디고, 특수=오렌지, 기타=슬레이트)
- 평수 / 희망 날짜 / 고객명 / 전화번호 / 주소 표시
- 접수 일시 (날짜 + 시:분)
- **ref_channel 배지**: amber 색상으로 유입 채널 표시 (값이 있을 때만)
- **업체 전송 완료 토글**: 클릭 → `PATCH /api/admin/leads` → DB 반영 → 카드 배경 즉시 초록으로 변경
- **삭제 버튼**: confirm 다이얼로그 → `DELETE /api/admin/leads` → DB 완전 삭제 → 카드 즉시 제거

#### 자동 새로고침
- 로그인 후 `setInterval`로 30초마다 `fetchLeads()` 자동 호출.
- 상단 헤더에 마지막 업데이트 시각 표시.
- 수동 새로고침 버튼 제공.

---

## 보안 포인트

| 위협 | 대응 |
|------|------|
| 고객이 타인 데이터 조회 | Supabase RLS — anon은 INSERT만 가능 |
| 관리자 API 무단 접근 | `x-admin-token` 헤더 + 서버에서만 검증 |
| 비밀번호 코드 노출 | 코드에 하드코딩 없음, 환경변수로만 관리 |
| ADMIN_PASSWORD 미설정 감지 | 설정 없으면 500 응답 (401과 구분) |
| GitHub에 비밀 노출 | `.env.local` gitignore, workflow.md에 평문 기록 금지 |

---

## 기술 스택 의존성

```
next@14.2.35
react@18
@supabase/supabase-js@^2
framer-motion@^12
lucide-react@^1.7
canvas-confetti@^1.9
tailwindcss@^3.4
typescript@^5
```

---

## 파일 구조

```
lead-marketing/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 루트 레이아웃 (폰트, 메타데이터)
│   │   ├── page.tsx                      # 랜딩 페이지 (Hero, Steps, CTA)
│   │   ├── globals.css                   # 전역 스타일
│   │   ├── api/
│   │   │   └── admin/leads/route.ts      # 관리자 API (GET/PATCH/DELETE)
│   │   └── admin/
│   │       └── leads/page.tsx            # 관리자 대시보드
│   ├── components/
│   │   ├── BookingForm.tsx               # 3단계 리드 수집 폼
│   │   └── RefChannelTracker.tsx         # URL ?ref= → localStorage 저장
│   └── lib/
│       ├── supabase.ts                   # Supabase anon 클라이언트
│       └── leads.ts                      # insertLead 함수
├── supabase/
│   └── leads_schema.sql                  # DB 스키마 (이미 적용 완료)
├── .env.local                            # 환경변수 (gitignore)
└── workflow.md                           # 이 파일
```

---

## 완료된 작업 이력

| # | 작업 | 상태 |
|---|------|------|
| 1 | Next.js 14 프로젝트 초기 세팅 (Tailwind, TS, ESLint) | ✅ |
| 2 | Supabase 클라이언트 초기화 (`src/lib/supabase.ts`) | ✅ |
| 3 | DB 스키마 설계 및 Supabase에 직접 적용 | ✅ |
| 4 | `insertLead()` 함수 + 에러 코드별 한국어 메시지 | ✅ |
| 5 | 3단계 BookingForm (Framer Motion 슬라이드, confetti) | ✅ |
| 6 | 랜딩 페이지 전체 구성 (Hero / Steps / CTA / Footer) | ✅ |
| 7 | 관리자 API (GET / PATCH / DELETE) | ✅ |
| 8 | 관리자 대시보드 (로그인 게이트, 리드 카드, 토글, 삭제) | ✅ |
| 9 | 보안 강화 — 비밀번호 환경변수화, 미설정 감지 500 처리 | ✅ |
| 10 | Vercel 배포 + ADMIN_PASSWORD 환경변수 설정 | ✅ |
| 11 | leads 테이블에 `ref_channel text` 컬럼 추가 (nullable) | ✅ |
| 12 | `RefChannelTracker` — URL `?ref=` 파라미터 → localStorage 저장 | ✅ |
| 13 | 폼 제출 시 `localStorage["ref_channel"]` 읽어 DB 저장 (없으면 "direct") | ✅ |
| 14 | 어드민 리드 카드에 ref_channel amber 배지 표시 | ✅ |
| 15 | 어드민 채널 분석 탭 추가 (날짜 필터 + 전환율 테이블) | ✅ |

---

## 남은 작업 (TODO)

- [ ] 신규 리드 발생 시 이메일/SMS 알림 (Supabase Edge Function 또는 외부 훅)
- [ ] OG 이미지 / SEO 메타태그 보강
- [ ] 애널리틱스 연동 (GA4 또는 유사 도구)
- [ ] 첫 예약 1만원 할인 문자 발송 자동화
- [ ] 관리자 인증 강화 (현재 단순 문자열 비교 → JWT 또는 세션 기반으로 교체)
