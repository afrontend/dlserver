interface MyLibraryChipsProps {
  libraries: string[];
  selectedLibrary: string;
  onSelect: (name: string) => void;
  onRemove: (name: string) => void;
  disabled?: boolean;
}

export const MyLibraryChips = ({
  libraries,
  selectedLibrary,
  onSelect,
  onRemove,
  disabled = false,
}: MyLibraryChipsProps) => {
  if (libraries.length === 0) {
    return (
      <p className="text-sm text-gray-400" data-testid="my-libraries-hint">
        <i className="fa fa-star-o mr-1" />
        도서관 하나를 골라 검색하면 "내 도서관"에 저장되어 다음부터 바로 고를 수 있습니다.
      </p>
    );
  }

  return (
    <div data-testid="my-libraries">
      <p className="text-sm text-gray-500 mb-2">
        <i className="fa fa-star text-yellow-400 mr-1" />
        내 도서관
      </p>
      <div className="flex flex-wrap gap-2">
        {libraries.map((name) => {
          const isSelected = name === selectedLibrary;
          return (
            <span
              key={name}
              className={`inline-flex items-center rounded-full border text-base ${
                isSelected
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(name)}
                className="pl-3 pr-1 py-1.5 disabled:opacity-50"
                data-testid="my-library-chip"
              >
                {name}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(name)}
                className={`pl-1 pr-3 py-1.5 disabled:opacity-50 ${
                  isSelected ? "text-blue-100 hover:text-white" : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label={`${name} 내 도서관에서 빼기`}
                data-testid="my-library-remove"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
};
