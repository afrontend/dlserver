import { useEffect, useRef, useState } from "react";
import { buildBookmarklet } from "../utils/bookmarklet";

/** 다른 사이트에서 책 제목을 드래그해 바로 검색하는 북마클릿 안내 */
export const BookmarkletHelp = () => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [clicked, setClicked] = useState(false);

  // React 는 javascript: href 를 막으므로 DOM 에 직접 넣는다
  useEffect(() => {
    linkRef.current?.setAttribute("href", buildBookmarklet(window.location.origin));
  }, []);

  return (
    <section className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-600" data-testid="bookmarklet-help">
      <h2 className="font-semibold text-gray-700">다른 사이트에서 바로 찾기</h2>
      <p className="mt-1">
        아래 버튼을 북마크바로 끌어다 놓으세요. 서점·블로그에서 책 제목을 드래그하고 북마크를 누르면
        내 도서관(최근에 검색한 도서관 최대 5곳)에서 찾습니다. 내 도서관이 없으면 제목만 채워 두니 도서관을
        고르세요.
      </p>
      <a
        ref={linkRef}
        data-testid="bookmarklet-link"
        onClick={(e) => {
          e.preventDefault();
          setClicked(true);
        }}
        className="mt-2 inline-block cursor-grab rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
      >
        동네 도서관에서 찾기
      </a>
      {clicked && <p className="mt-1 text-gray-500">여기서 누르지 말고 북마크바로 끌어다 놓으세요.</p>}
    </section>
  );
};
