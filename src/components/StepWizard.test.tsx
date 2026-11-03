import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepWizard } from "./StepWizard";
import { DEFAULT_LIBRARY } from "../constants";

const defaultProps = {
  searchText: "",
  onSearchTextChange: vi.fn(),
  searchHistory: [] as string[],
  onHistorySelect: vi.fn(),
  onHistoryClear: vi.fn(),
  filteredLibraries: [{ id: 1, name: "판교" }],
  selectedLibrary: DEFAULT_LIBRARY,
  onLibraryChange: vi.fn(),
  filterText: "",
  onFilterChange: vi.fn(),
  modules: [] as { name: string; libraries: string[] }[],
  selectedModule: "",
  onModuleChange: vi.fn(),
  onSearch: vi.fn(),
  onCancel: vi.fn(),
  isLoading: false,
};

describe("StepWizard", () => {
  it("renders step indicator with 3 steps", () => {
    render(<StepWizard {...defaultProps} />);
    expect(screen.getByTestId("step-indicator-1")).toBeInTheDocument();
    expect(screen.getByTestId("step-indicator-2")).toBeInTheDocument();
    expect(screen.getByTestId("step-indicator-3")).toBeInTheDocument();
  });

  it("shows step 1 content initially", () => {
    render(<StepWizard {...defaultProps} />);
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
    expect(screen.queryByTestId("step-2-content")).not.toBeInTheDocument();
  });

  it("advances to step 2 when Enter is pressed in search input with text", () => {
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("step-1-summary")).toBeInTheDocument();
    expect(screen.getByTestId("step-2-content")).toBeInTheDocument();
  });

  it("shows step 1 summary with book title after completing step 1", () => {
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("step-1-summary")).toHaveTextContent("해리포터");
  });

  it("does not advance to step 2 when Enter pressed with empty text", () => {
    render(<StepWizard {...defaultProps} searchText="" />);
    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
    expect(screen.queryByTestId("step-2-content")).not.toBeInTheDocument();
  });

  it("shows search button in step 3", async () => {
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-next"));
    expect(screen.getByTestId("search-submit-button")).toBeInTheDocument();
  });

  it("calls onSearch when search button is clicked in step 3", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" onSearch={onSearch} />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-next"));
    await user.click(screen.getByTestId("search-submit-button"));
    expect(onSearch).toHaveBeenCalled();
  });

  it("shows filtered library names in step 3 summary when filter is active", async () => {
    const user = userEvent.setup();
    const filteredLibraries = [
      { id: 0, name: "여주시립도서관" },
      { id: 1, name: "여주어린이도서관" },
    ];
    render(
      <StepWizard
        {...defaultProps}
        searchText="해리포터"
        filterText="여주"
        filteredLibraries={filteredLibraries}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-next"));

    const step3 = screen.getByTestId("step-3-content");
    expect(step3).toHaveTextContent("여주시립도서관");
    expect(step3).toHaveTextContent("여주어린이도서관");
    expect(step3).not.toHaveTextContent("전체 도서관");
  });

  it("shows '전체 도서관' in step 3 summary when no filter is active", async () => {
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" filterText="" />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-next"));

    expect(screen.getByTestId("step-3-content")).toHaveTextContent("전체 도서관");
  });

  it("shows filtered library names in step 2 summary when filter is active", async () => {
    const user = userEvent.setup();
    const filteredLibraries = [
      { id: 0, name: "여주시립도서관" },
      { id: 1, name: "여주어린이도서관" },
    ];
    render(
      <StepWizard
        {...defaultProps}
        searchText="해리포터"
        filterText="여주"
        filteredLibraries={filteredLibraries}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-next"));

    const step2Summary = screen.getByTestId("step-2-summary");
    expect(step2Summary).toHaveTextContent("여주시립도서관");
    expect(step2Summary).toHaveTextContent("여주어린이도서관");
  });

  it("resets to step 1 when edit button is clicked on step 1 summary", async () => {
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    expect(screen.getByTestId("step-1-summary")).toBeInTheDocument();
    await user.click(screen.getByTestId("step-1-edit"));
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
    expect(screen.queryByTestId("step-1-summary")).not.toBeInTheDocument();
  });
});

describe("StepWizard 내 도서관", () => {
  const goToStep2 = (props: Partial<typeof defaultProps> & Record<string, unknown>) => {
    render(<StepWizard {...defaultProps} searchText="해리포터" {...props} />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
  };

  it("저장된 도서관이 없으면 안내 문구를 보여 준다", () => {
    goToStep2({ myLibraries: [], onMyLibrarySelect: vi.fn(), onMyLibraryRemove: vi.fn() });
    expect(screen.getByTestId("my-libraries-hint")).toBeInTheDocument();
  });

  it("칩을 누르면 도서관을 고르고 검색 단계로 넘어간다", async () => {
    const onMyLibrarySelect = vi.fn();
    goToStep2({ myLibraries: ["판교도서관"], onMyLibrarySelect, onMyLibraryRemove: vi.fn() });

    await userEvent.click(screen.getByTestId("my-library-chip"));

    expect(onMyLibrarySelect).toHaveBeenCalledWith("판교도서관");
    expect(screen.getByTestId("step-2-summary")).toBeInTheDocument();
    expect(screen.getByTestId("step-3-content")).toBeInTheDocument();
  });

  it("× 를 누르면 그 도서관을 뺀다", async () => {
    const onMyLibraryRemove = vi.fn();
    goToStep2({ myLibraries: ["판교도서관"], onMyLibrarySelect: vi.fn(), onMyLibraryRemove });

    await userEvent.click(screen.getByTestId("my-library-remove"));

    expect(onMyLibraryRemove).toHaveBeenCalledWith("판교도서관");
    expect(screen.getByTestId("step-2-content")).toBeInTheDocument();
  });

  it("onMyLibrarySelect 가 없으면 내 도서관 영역을 그리지 않는다", () => {
    goToStep2({});
    expect(screen.queryByTestId("my-libraries")).not.toBeInTheDocument();
    expect(screen.queryByTestId("my-libraries-hint")).not.toBeInTheDocument();
  });
});

describe("StepWizard 지역 선택", () => {
  const regions = [
    { sido: "경기도", sigungus: ["성남시", "수원시"] },
    { sido: "서울특별시", sigungus: ["마포구"] },
  ];
  const goToStep2 = (props: Partial<typeof defaultProps> & Record<string, unknown>) => {
    render(<StepWizard {...defaultProps} searchText="해리포터" {...props} />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
  };

  it("시도를 고르면 시군구 없이 알린다", async () => {
    const onRegionChange = vi.fn();
    goToStep2({ regions, onRegionChange });

    expect(screen.getByTestId("sigungu-select")).toBeDisabled();
    await userEvent.selectOptions(screen.getByTestId("sido-select"), "경기도");

    expect(onRegionChange).toHaveBeenCalledWith("경기도", "");
  });

  it("고른 시도의 시군구를 보여 주고 고르면 함께 알린다", async () => {
    const onRegionChange = vi.fn();
    goToStep2({ regions, selectedSido: "경기도", onRegionChange });

    const sigungu = screen.getByTestId("sigungu-select");
    expect(sigungu).toBeEnabled();
    expect(Array.from((sigungu as HTMLSelectElement).options).map((o) => o.value)).toEqual(["", "성남시", "수원시"]);
    await userEvent.selectOptions(sigungu, "수원시");

    expect(onRegionChange).toHaveBeenCalledWith("경기도", "수원시");
  });

  it("요약에 고른 지역을 보여 준다", async () => {
    goToStep2({ regions, selectedSido: "경기도", selectedSigungu: "성남시", onRegionChange: vi.fn() });

    await userEvent.click(screen.getByTestId("step-2-next"));

    expect(screen.getByTestId("step-2-summary")).toHaveTextContent("경기도 성남시 > 전체 도서관");
  });

  it("요약에 지역 다음 모듈을 보여 준다", async () => {
    goToStep2({
      regions,
      selectedSido: "서울특별시",
      selectedSigungu: "마포구",
      modules: [{ name: "마포구립도서관", libraries: ["판교"] }],
      selectedModule: "마포구립도서관",
      onRegionChange: vi.fn(),
    });

    await userEvent.click(screen.getByTestId("step-2-next"));

    expect(screen.getByTestId("step-2-summary")).toHaveTextContent("서울특별시 마포구 > 마포구립도서관 > 전체 도서관");
  });

  it("onRegionChange 가 없으면 지역 선택을 그리지 않는다", () => {
    goToStep2({ regions });
    expect(screen.queryByTestId("region-selects")).not.toBeInTheDocument();
  });
});
