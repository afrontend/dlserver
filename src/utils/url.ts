import { DEFAULT_LIBRARY } from "../constants";

// URL parameter helpers
export const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get("title") || "",
    library: params.get("library") || DEFAULT_LIBRARY,
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
