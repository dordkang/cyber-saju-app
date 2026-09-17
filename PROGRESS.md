# 🔮 CYBER-SAJU-APP 개발 현황 및 아키텍처 마스터 플랜

## 1. 프로젝트 개요 및 핵심 철학
- **프로젝트명:** cyber-saju-app (사이버 오행 엔진)
- **개발 목표:** 서버 유지비 0원 수렴, 로컬 퍼스트(Local-First) DB 기반 한·중·일 동양 3국 AI 사주 & 데일리 감정 일기 코칭 모바일 앱
- **핵심 아키텍처:**
  1. **Local-First SQLite DB:** 사용자 사주 정보와 일기 본문은 기기 내부에만 저장하여 중앙 DB 서버비 영구 0원 유지 및 개인정보 보호.
  2. **하이브리드 연산:** 만세력 4주 8자 및 오행 비율은 `lunar-javascript`로 100% 정밀 연산하여 AI 할루시네이션 원천 차단.
  3. **Cloudflare Worker 보안 게이트웨이:** 스마트폰 앱 코드 내 AI API Key 은닉 및 요청 중계.
  4. **멀티 에이전트 프롬프트 스토어:** 한국(단칼 도사), 일본(우라나이), 중국(고전 격국), 서구권(스토익 코치) 분리 운용.

---

## 2. 현재 기술 스택
- **프레임워크:** Expo SDK 57 (React Native 0.86, React 19, TypeScript)
- **만세력 엔진:** `lunar-javascript`
- **로컬 스토리지:** `expo-sqlite`
- **검증 환경:** PC USB 직결 및 `scrcpy` 실기기 미러링
- **버전 관리:** Git & GitHub

---

## 3. 구현 완료 내역 (Phase 1 완료)
- [x] **만세력 연산 엔진 (`src/engine/`):**
  - `types.ts`: 4주 8자 및 오행 비율(`ElementBalance`) 규격 정의
  - `calculator.ts`: 1975-06-11 05:00 기준 년주(乙卯), 월주(壬午), 일주(戊子), 시주(乙卯) 및 오행 백분율 산출 검증 완료
- [x] **로컬 SQLite DB (`src/database/`):**
  - `db.ts`: `cyber_saju.db` 생성, `user_profile` 및 `daily_diary` 테이블 생성
  - 단일 프로필 저장 및 날짜 기준 일기 Upsert 로직 구현 완료
- [x] **UI 프로토타입 및 실기기 검증 (`App.tsx`):**
  - 사이버 다크 네온 테마 기본 레이아웃 적용
  - 앱 기동 시 DB 초기화, 만세력 계산 및 샘플 일기 저장/조회 목록 렌더링 검증 완료

---

## 4. 다음 작업 단계 (Phase 2)
- [ ] Cloudflare Worker 게이트웨이 프로젝트 생성 (`cyber-saju-gateway`)
- [ ] Gemini API Key 환경변수(Secret) 격리 및 프록시 라우팅 연동
- [ ] 앱(Expo) ↔ Cloudflare Worker 간 통신 연동