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

const canTrack = () =>
  typeof window !== "undefined" && import.meta.env.PROD && typeof GA_ID === "string" && GA_ID.length > 0;

export const initAnalytics = () => {
  if (!canTrack() || window.gtag || document.getElementById(GA_SCRIPT_ID)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer.push(args);
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

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
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

  window.gtag("event", "search", {
    search_term: searchTerm,
    library_name: libraryName,
    search_scope: scope,
    library_count: libraryCount,
  });
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
