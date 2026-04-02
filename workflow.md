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
| 배포 | 미정 |

---

## 완료된 작업

### 1. 프로젝트 초기 세팅
- `create-next-app` 으로 Next.js 14 프로젝트 생성
- Tailwind CSS, TypeScript, ESLint 설정 완료
- `.env.local`에 Supabase 환경변수 설정
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 관리자 API용)
  - `ADMIN_PASSWORD` (관리자 페이지 비밀번호, 현재: `1234`)

### 2. Supabase 연동 (`src/lib/supabase.ts`)
- `@supabase/supabase-js` 클라이언트 초기화
- 환경변수 누락 시 명시적 에러 throw

### 3. DB 스키마 설계 및 적용 (`supabase/leads_schema.sql`)
- `public.leads` 테이블 — **Supabase Management API로 직접 실행 완료**
  - 컬럼: `id`, `name`, `phone`, `address`, `service_type`, `size`, `date`, `status`, `created_at`
  - `service_type`: 입주청소 | 퇴거청소 | 거주청소 | 원룸청소 | 사무실청소 | 특수청소 | 기타청소
  - `status`: pending | matched | completed | cancelled (기본값 `pending`)
- 인덱스: `status`, `created_at DESC`
- RLS 설정
  - `anon` 역할: INSERT 전용
  - `service_role`: 전체 권한 (관리자 대시보드용)

### 4. 리드 저장 함수 (`src/lib/leads.ts`)
- `insertLead(payload)` 함수 구현
- Supabase 에러 코드별 한국어 메시지 처리
  - `23505` → 중복 번호 안내
  - `42501` → 권한 오류 안내
- 네트워크 오류 catch 처리
- 반환 타입: `{ success: boolean; error?: string }`

### 5. 다단계 예약 폼 (`src/components/BookingForm.tsx`)
- 3단계 스텝 폼 구현 (Framer Motion 슬라이드 애니메이션)
  - **Step 1**: 청소 종류 선택 — 6종 (입주청소 / 퇴거청소 / 거주청소 / 사무실청소 / 특수청소 / 그 외 기타 청소)
  - **Step 2**: 평수 슬라이더(10~100평, **1평 단위**) + 희망 날짜 선택
  - **Step 3**: 이름 / 전화번호 / 상세 주소 입력
- 날짜 입력: 전체 박스 클릭 시 `showPicker()` 호출로 캘린더 팝업, 선택 후 한국어 날짜 표시
- 실시간 유효성 검사
  - 이름: 2자 이상
  - 전화번호: 자동 포맷(010-XXXX-XXXX), 010·011 시작 검증
  - 주소: 5자 이상
- 제출 성공 시 confetti 애니메이션 + 완료 화면 표시
- 에러 배너 컴포넌트(`ErrorBanner`) 공통화
- 진행 상태 표시바 + 스텝 인디케이터

### 6. 랜딩 페이지 (`src/app/page.tsx`)
- **Header**: sticky 네비게이션, 무료 견적 신청 CTA 버튼
- **Hero**: 그라디언트 배경, 헤드카피, 신뢰 배지 1개
  - 만족도 4.9점을 목표로 꼼꼼하게 관리합니다
- **Booking Form 섹션**: 업체 매칭 시 첫 예약 1만원 할인 혜택 안내 + `BookingForm` 컴포넌트 삽입
- **How it works**: 3단계 이용 방법 카드
- **CTA 배너**: 진한 네이비 배경, 무료 견적 신청 버튼
- **Footer**: 사업자 정보

### 7. 관리자 API (`src/app/api/admin/leads/route.ts`)
- `GET /api/admin/leads` — 전체 리드 최신순 조회 (service_role 클라이언트 사용)
- `PATCH /api/admin/leads` — 리드 status 업데이트
- `DELETE /api/admin/leads` — 리드 삭제 (DB에서 완전 삭제)
- `x-admin-token` 헤더로 비밀번호 검증 (서버에서 `ADMIN_PASSWORD` 환경변수와 비교)
- 비밀번호는 코드에 하드코딩하지 않고 Vercel 환경변수로만 관리

### 8. 관리자 대시보드 (`src/app/admin/leads/page.tsx`)
- 비밀번호 게이트 — API 응답(401/200)으로 인증 여부 판단 (코드에 비밀번호 없음)
- **상단 요약**
  - 오늘 들어온 리드 수
  - 이번 달 예상 수익 (업체 전송 완료 건 × 2만원)
- **리드 카드 목록** (최신순, 2~3열 그리드)
  - 서비스 종류 컬러 배지 + 평수 + 희망 날짜
  - 고객명 / 전화번호 / 주소
  - 업체 전송 완료 토글 스위치 (클릭 즉시 DB 반영, 카드 배경 초록으로 변경)
  - 삭제 버튼 (확인 후 DB에서 완전 삭제, 카드 즉시 제거)
- 30초마다 자동 새로고침 + 수동 새로고침 버튼

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
│   │   ├── page.tsx                      # 랜딩 페이지 (Hero, Steps, Reviews, CTA)
│   │   ├── globals.css                   # 전역 스타일
│   │   ├── api/
│   │   │   └── admin/leads/route.ts      # 관리자 API (GET 조회, PATCH 상태변경)
│   │   └── admin/
│   │       └── leads/page.tsx            # 관리자 대시보드
│   ├── components/
│   │   └── BookingForm.tsx               # 3단계 리드 수집 폼
│   └── lib/
│       ├── supabase.ts                   # Supabase 클라이언트
│       └── leads.ts                      # insertLead 함수
├── supabase/
│   └── leads_schema.sql                  # DB 스키마 (이미 적용 완료)
├── .env.local                            # 환경변수 (gitignore)
└── workflow.md                           # 이 파일
```

---

## 남은 작업 (TODO)

- [ ] 업체 매칭 알림 — 신규 리드 발생 시 이메일/SMS 발송 (Supabase Edge Function 또는 외부 훅)
- [x] 배포 — Vercel (GitHub 푸시 시 자동 배포)
- [ ] OG 이미지 / SEO 메타태그 보강
- [ ] 애널리틱스 연동 (GA4 또는 유사 도구)
- [ ] 첫 예약 1만원 할인 문자 발송 자동화
- [ ] 관리자 비밀번호 강화 (현재 단순 문자열 비교 → JWT 또는 세션 기반 인증으로 교체)
