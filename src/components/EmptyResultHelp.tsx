interface EmptyResultHelpProps {
  /** 도서관 하나를 검색했을 때 그 도서관 이름 */
  libraryName?: string;
  /** 그 도서관 사이트 주소 */
  homeUrl?: string;
  /** 같은 모듈(시·군 도서관)의 다른 도서관까지 넓혀 검색할 때 모듈명 */
  widenModule?: string;
  onWiden?: () => void;
}

/** 검색 결과가 없을 때 "없음" 에서 끝나지 않도록 다음 행동을 안내한다 */
export const EmptyResultHelp = ({ libraryName, homeUrl, widenModule, onWiden }: EmptyResultHelpProps) => (
  <div className="mt-3 space-y-2 text-base" data-testid="empty-result-help">
    <p className="text-gray-500">
      제목을 짧게 줄이거나 부제·권수를 빼고 다시 검색해 보세요.
    </p>
    {widenModule && onWiden && (
      <button
        type="button"
        data-testid="widen-search"
        onClick={onWiden}
        className="text-blue-600 hover:text-blue-800"
      >
        {widenModule} 전체에서 찾기
      </button>
    )}
    {homeUrl && (
      <p>
        <a
          href={homeUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="library-site-link"
          className="text-blue-600 hover:text-blue-800"
        >
          {libraryName ? `${libraryName} 사이트에서 직접 확인하기` : "도서관 사이트에서 직접 확인하기"}
        </a>
      </p>
    )}
  </div>
);
