# X Business 랜딩 페이지 — 디자인 시스템 분석

> 출처: [business.x.com/en](https://business.x.com/en)  
> 분석 목적: 깔끔하고 모던한 느낌의 디자인 요소를 추출하여 학습 및 리믹스에 활용

---

## 1. 전체적인 느낌 (Vibe)

- 다크 모드 기반의 미니멀 랜딩 페이지
- 흑백 + 브랜드 포인트 컬러만 사용
- 여백을 넉넉히 쓰고, 보더 라인으로 섹션 구분
- 타이포그래피가 굵고 큰 히어로 + 작고 조밀한 본문의 대비
- 라운드가 극대화된 pill 버튼과 둥근 UI 요소
- 미세한 투명도로 텍스트 계층감 부여

---

## 2. 컬러 팔레트

| 용도 | HEX / RGBA | 비고 |
|------|-----------|------|
| 메인 배경 | `#0d0d0d` (`--color-neutral-1100`) | 거의 검은색 |
| 보조 배경 / 카드 | `#141414` (`--x-bg-secondary`) | 살짝 밝은 다크 |
| 기본 텍스트 | `#ffffff` | 흰색 |
| 흐린 텍스트 (약함) | `#ffffff4d` | 30% 투明白색 |
| 중간 텍스트 | `#ffffffb3` | 70% 투明白색 |
| 중립 그레이 | `#4d4d4d`, `#262626`, `#d9d9d9`, `#b2b2b2` | 보더, 서브텍스트 |
| 브랜드 포인트 | `#1d9bf0` (`--x-button-brand`) | X 블루, CTA 강조 |
| 성공 / 데이터 | `#00ba7c` | 그린 |
| 강조 / 알림 | `#f91880` | 마젠타 |
| 경고 | `#ffd400` | 노랑 |

### 사용된 CSS 변수 예시

```css
--color-white: #fff;
--color-black-a80: #000c;
--color-black-a60: #0009;
--color-neutral-1100: #0d0d0d;
--color-neutral-900: #262626;
--color-neutral-700: #4d4d4d;
--color-neutral-300: #b2b2b2;
--x-button-brand: #1d9bf0;
--x-button-secondary: #ffffff1a;
--x-button-tertiary: #ffffff1a;
--x-button-tertiary-hover: #fff3;
--x-button-ghost-hover: #ffffff1a;
```

---

## 3. 타이포그래피 시스템

### 사용 폰트

- X 자체 가변 폰트: `xVF`, `xVFDisplay`
- 직접 구현 시 대체 폰트 추천:
  - **Inter** — 가장 무난, 깔끔
  - **Geist** — 테크/모던 느낌
  - **Switzer** — 미니멀, 세련
  - **Satoshi** — 지오메트릭, 모던
  - **Manrope** / **Plus Jakarta Sans**

### 타이포그래피 스케일

| 용도 | 크기 | 웨이트 | 행간 | 특이사항 |
|------|------|--------|------|---------|
| 히어로 타이틀 | `3rem` (48px) | 500 | 52px | `-0.32px` letter-spacing |
| 디스플레이 서브 | 32px | 500 | 36px | — |
| H3 / 섹션 헤딩 | 20px | 500~580 | 28px | 타이트한 spacing |
| 본문 | 13px | 400~500 | 20px | 본문을 작게 |
| 캡션 / 메타 | 11~12px | 500~600 | 13~18px | — |
| 버튼 | 13px | 500 | 20px | — |
| eyebrow | 13px | 500 | 18px | 섹션 상단 작은 라벨 |

### 핵심 포인트

- 폰트 패밀리는 1종류로 통일
- 웨이트는 400, 500, 580 수준만 사용 (700 bold 거의 없음)
- 제목은 letter-spacing를 살짝 타이트하게
- 본문은 13px로 작게 써서 정보 밀도를 낮춤
- 텍스트 색상 투명도로 계층감 부여 (100% → 70% → 30%)

---

## 4. 레이아웃 & 여백

### 컨테이너

- 최대 너비: `70rem` (약 1120px)
- 좌우 패딩: responsive (모바일 16~24px, 태블릿 이상 64px 이상)
- 컨텐츠 중앙 정렬

### 섹션

| 속성 | 값 |
|------|-----|
| 섹션 위 여백 | `pt-20` ~ `pt-18` (72~80px) |
| 섹션 아래 여백 | `pb-16` ~ `pb-20` (64~80px) |
| 섹션 간 구분 | `border-t` 얇은 라인 (`rgba(255,255,255,0.1)` 수준) |
| 그리드 갭 | 56px (`gap-14`), 큰 섹션은 86px |

### 레이아웃 원칙

- 배경색을 자주 바꾸지 않음
- 섹션 구분은 거의 `border-top` 하나로 끝냄
- 여백을 아낌없이 사용해 고급스러운 느낌
- 히어로 섹션은 좌우로 넓게, 정보 섹션은 좁게

---

## 5. UI 컴포넌트

### Primary CTA 버튼

```css
background: #ffffff;
color: #000000;
border-radius: 9999px;  /* pill */
padding: 0 12px;
height: 32px;
font-size: 13px;
font-weight: 500;
border: 0;
```

### Secondary / Ghost 버튼

```css
background: transparent;
color: #ffffff;
border-radius: 9999px;
/* hover */
background: rgba(255, 255, 255, 0.1);
```

### 탑 네비게이션

- 투명/반투명 배경 (`oklab(0 0 0 / 0.4)`)
- 텍스트 흰색
- 네비 항목 간 여백 여유
- 드롭다운 메뉴 아이템 pill 형태

### 카드 / 콘텐츠 박스

```css
background: #141414;
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 0;  /* 거의 사각 */
```

### 입력 폼

- 다크 모드 통합 입력
- 투명 또는 어두운 배경
- placeholder: muted gray
- border-bottom 또는 전체 border 스타일

---

## 6. 모션 & 인터랙션

### 주요 easing

```css
cubic-bezier(.23, 1, .32, 1)
```

- 자연스러운 ease-out 느낌
- 메뉴 아이템 등장: `0.3s`

### 추천 효과

- hover 시 배경색/텍스트색 0.2~0.3s ease-out 전환
- 스크롤 등장 애니메이션은 stagger로 순차 등장
- 섹션 전환은 subtle, 과하지 않게

---

## 7. 핵심 디자인 원칙 요약

이 페이지가 “깔끔하고 모던해 보이는” 이유:

1. **컬러 최소화** — 흑백 + 1~2개 포인트 컬러만
2. **타이포 통일** — 하나의 폰트, 2~3개 웨이트만 사용
3. **여백의 힘** — 넉넉한 섹션 간격으로 호화로운 느낌
4. **라인으로 구분** — 배경색 변경보다 얇은 보더 선호
5. **Pill 버튼** — 완전한 라운드가 모던함을 더함
6. **큰 타이틀 + 짧은 카피** — 메시지는 강하고 간결하게
7. **투명도로 계층** — 텍스트 중요도를 색상 투명도로 구분

---

## 8. Tailwind CSS 활용 예시

```css
@layer base {
  :root {
    --bg-primary: #0d0d0d;
    --bg-secondary: #141414;
    --fg-primary: #ffffff;
    --fg-muted: rgba(255, 255, 255, 0.7);
    --fg-dim: rgba(255, 255, 255, 0.3);
    --border: rgba(255, 255, 255, 0.1);
    --accent: #1d9bf0;
  }
}
```

```html
<section class="border-t border-[rgba(255,255,255,0.1)] py-20">
  <div class="mx-auto max-w-[70rem] px-6">
    <h2 class="text-[32px] font-medium leading-9 tracking-tight text-white">
      Headline here
    </h2>
    <p class="mt-4 text-[13px] leading-5 text-white/70">
      Supporting body copy at 13px with muted opacity.
    </p>
    <button class="mt-8 h-8 rounded-full bg-white px-3 text-[13px] font-medium text-black">
      Get started
    </button>
  </div>
</section>
```

---

## 9. 사용 시 주의

- 이 문서는 **디자인 학습 및 리믹스를 위한 레퍼런스**입니다.
- 실제 X 사이트의 이미지, 3D 에셋, 브랜드 문구, 코드 등은 그대로 복사하여 상업적으로 사용할 수 없습니다.
- 컬러, 타이포그래피, 레이아웃 원칙은 참고하되, 자신만의 브랜드 에셋과 콘텐츠로 재구성하세요.

---

*추출일: 2026-08-07*
