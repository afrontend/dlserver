// 확장이 여는 검색 주소. 북마클릿(src/utils/bookmarklet.ts)과 같은 규칙이다.
export const SITE_ORIGIN = "https://dongne.afrontend.dev";

/** 선택한 텍스트를 제목으로 다듬는다. 줄바꿈·연속 공백은 한 칸, 최대 100자 */
export const normalizeTitle = (text) =>
  String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
    .trim();

/**
 * 제목이 있으면 `/?title=…&ref=ext`, 없으면 `/?ref=ext` 를 돌려준다.
 * 도서관은 넣지 않는다. 사이트가 ref 를 보고 내 도서관에서 찾는다.
 */
export const buildSearchUrl = (text, origin = SITE_ORIGIN) => {
  const url = new URL("/", origin);
  const title = normalizeTitle(text);
  if (title) url.searchParams.set("title", title);
  url.searchParams.set("ref", "ext");
  return url.href;
};
