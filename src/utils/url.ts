// URL parameter helpers
export const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get("title") || "",
    library: params.get("library") || "도서관을 선택하세요.",
  };
};

export const updateUrl = (title: string, library: string) => {
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (library !== "도서관을 선택하세요.") params.set("library", library);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.pushState({ title, library }, "", newUrl);
};
