declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }

  interface ImportMetaEnv {
    readonly VITE_GA_ID?: string;
    readonly PROD: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// dongne.onrender.com 웹 스트림의 측정 ID. VITE_GA_ID 가 없는 빌드도 이 ID 로 보낸다.
const DEFAULT_GA_ID = "G-9WDTNJDBR7";
const GA_ID = import.meta.env.VITE_GA_ID || DEFAULT_GA_ID;
const GA_SCRIPT_ID = "google-analytics-gtag";

/**
 * 들어온 경로(?ref=ext, ?ref=bm 등). 영문 소문자·숫자·-·_ 20자까지만 받는다.
 * 첫 검색이 주소를 바꾸기 전에 읽어야 하므로 모듈을 불러올 때 한 번 잡아 둔다.
 */
export const parseEntryRef = (search: string) => {
  const ref = new URLSearchParams(search).get("ref");
  return ref && /^[a-z0-9_-]{1,20}$/.test(ref) ? ref : undefined;
};

let entryRef = typeof window === "undefined" ? undefined : parseEntryRef(window.location.search);

/** 테스트용: 들어온 경로를 바꾼다 */
export const setEntryRef = (ref: string | undefined) => {
  entryRef = ref;
};

const withEntryRef = <T extends Record<string, unknown>>(params: T) =>
  entryRef ? { ...params, entry_ref: entryRef } : params;

/** GA 가 유입 소스로 인식하도록 page_location 에 utm_source 를 붙인다 */
const pageLocation = () => {
  if (!entryRef) return window.location.href;
  const url = new URL(window.location.href);
  url.searchParams.set("utm_source", entryRef);
  url.searchParams.set("utm_medium", "referral");
  return url.toString();
};

const canTrack = () =>
  typeof window !== "undefined" && import.meta.env.PROD && typeof GA_ID === "string" && GA_ID.length > 0;

export const initAnalytics = () => {
  if (!canTrack() || window.gtag || document.getElementById(GA_SCRIPT_ID)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  // gtag.js 는 dataLayer 에 들어온 arguments 객체만 명령으로 처리한다.
  // 나머지 매개변수(...args)로 만든 배열을 넣으면 config·event 가 무시되어 아무것도 전송되지 않는다.
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
};

export const trackPageView = () => {
  if (!canTrack() || !window.gtag) {
    return;
  }

  window.gtag(
    "event",
    "page_view",
    withEntryRef({
      page_title: document.title,
      page_location: pageLocation(),
      page_path: `${window.location.pathname}${window.location.search}`,
    }),
  );
};

/**
 * 검색 범위.
 * - single: 도서관 하나
 * - group: 모듈이나 이름 필터로 좁힌 여러 도서관
 * - all: 등록된 전체 도서관
 */
export type SearchScope = "single" | "group" | "all";

export const trackSearch = (
  searchTerm: string,
  libraryName: string,
  scope: SearchScope,
  libraryCount: number,
) => {
  if (!canTrack() || !window.gtag) {
    return;
  }

  window.gtag(
    "event",
    "search",
    withEntryRef({
      search_term: searchTerm,
      library_name: libraryName,
      search_scope: scope,
      library_count: libraryCount,
    }),
  );
};

export interface SearchCompleteParams {
  libraryCount: number;
  failedCount: number;
  resultCount: number;
  availableCount: number;
  durationMs: number;
}

export const trackSearchComplete = (params: SearchCompleteParams) => {
  if (!canTrack() || !window.gtag) {
    return;
  }

  window.gtag("event", "search_complete", {
    library_count: params.libraryCount,
    failed_count: params.failedCount,
    result_count: params.resultCount,
    available_count: params.availableCount,
    duration_ms: params.durationMs,
  });
};

export interface SearchCancelParams {
  libraryCount: number;
  completedCount: number;
  durationMs: number;
}

export const trackSearchCancel = (params: SearchCancelParams) => {
  if (!canTrack() || !window.gtag) {
    return;
  }

  window.gtag("event", "search_cancel", {
    library_count: params.libraryCount,
    completed_count: params.completedCount,
    duration_ms: params.durationMs,
  });
};

/** "내 도서관" 칩으로 도서관을 골랐을 때 */
export const trackMyLibrarySelect = () => {
  if (!canTrack() || !window.gtag) {
    return;
  }

  window.gtag("event", "my_library_select");
};
