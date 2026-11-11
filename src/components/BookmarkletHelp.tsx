import { useEffect, useRef, useState } from "react";
import { buildBookmarklet } from "../utils/bookmarklet";

interface BookmarkletHelpProps {
  /** 지금 고른 도서관. 없으면 북마클릿을 만들지 않는다 (전체 도서관 검색이 되므로) */
  libraryName?: string;
}

/** 다른 사이트에서 책 제목을 드래그해 바로 검색하는 북마클릿 안내 */
export const BookmarkletHelp = ({ libraryName }: BookmarkletHelpProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [clicked, setClicked] = useState(false);

  // React 는 javascript: href 를 막으므로 DOM 에 직접 넣는다
  useEffect(() => {
    if (libraryName && linkRef.current) {
      linkRef.current.setAttribute("href", buildBookmarklet(window.location.origin, libraryName));
    }
  }, [libraryName]);

  return (
    <section className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-600" data-testid="bookmarklet-help">
      <h2 className="font-semibold text-gray-700">다른 사이트에서 바로 찾기</h2>
      {libraryName ? (
        <>
          <p className="mt-1">
            아래 버튼을 북마크바로 끌어다 놓으세요. 서점·블로그에서 책 제목을 드래그하고 북마크를 누르면{" "}
            {libraryName}에서 검색합니다.
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
        </>
      ) : (
        <p className="mt-1">도서관을 하나 고르면, 그 도서관에서 바로 검색하는 북마크 버튼이 여기에 나타납니다.</p>
      )}
    </section>
  );
};
