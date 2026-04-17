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

const GA_ID = import.meta.env.VITE_GA_ID;
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

export const trackSearch = (searchTerm: string, libraryName: string) => {
  if (!canTrack() || !window.gtag) {
    return;
  }

  window.gtag("event", "search", {
    search_term: searchTerm,
    library_name: libraryName,
  });
};
