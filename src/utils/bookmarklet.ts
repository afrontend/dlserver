/**
 * 북마클릿 코드. 다른 사이트에서 고른 글자(없으면 입력창)로 dongne 검색을 새 탭에 연다.
 * 다른 사이트에서 실행되므로 이 사이트의 localStorage 를 읽을 수 없다. 도서관은 만들 때 코드에 넣는다.
 */
export const buildBookmarklet = (origin: string, library: string) => {
  const code = `(()=>{let t=String(getSelection()).trim();if(!t)t=prompt("찾을 책 제목")||"";t=t.trim().slice(0,100);if(!t)return;const u=new URL(${JSON.stringify(`${origin}/`)});u.searchParams.set("title",t);u.searchParams.set("library",${JSON.stringify(library)});u.searchParams.set("ref","bm");window.open(u.href,"_blank")})()`;
  return `javascript:${encodeURIComponent(code)}`;
};
