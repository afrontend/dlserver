import { DEFAULT_LIBRARY } from "../constants";

// URL parameter helpers
export const getUrlParams = (): { title: string; library: string; ref?: string } => {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get("title") || "",
    library: params.get("library") || DEFAULT_LIBRARY,
    // 북마클릿·확장 등 다른 곳에서 들어왔는지
    ref: params.get("ref") || undefined,
  };
};

export const updateUrl = (title: string, library: string) => {
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (library !== DEFAULT_LIBRARY) params.set("library", library);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.pushState({ title, library }, "", newUrl);
};
