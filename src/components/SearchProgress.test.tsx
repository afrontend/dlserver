import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchProgressBar } from "./SearchProgress";
import type { SearchProgress } from "../types";

describe("SearchProgressBar", () => {
  it("renders nothing when not searching all libraries", () => {
    const progress: SearchProgress = {
      totalLibraries: 5,
      completedLibraries: 2,
      searchingLibraries: ["판교"],
      isSearchingAll: false,
    };

    const { container } = render(<SearchProgressBar progress={progress} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when totalLibraries is 0", () => {
    const progress: SearchProgress = {
      totalLibraries: 0,
      completedLibraries: 0,
      searchingLibraries: [],
      isSearchingAll: true,
    };

    const { container } = render(<SearchProgressBar progress={progress} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows progress when searching all libraries", () => {
    const progress: SearchProgress = {
      totalLibraries: 10,
      completedLibraries: 3,
      searchingLibraries: ["판교", "동탄"],
      isSearchingAll: true,
    };

    render(<SearchProgressBar progress={progress} />);

    expect(screen.getByTestId("search-progress")).toBeInTheDocument();
    expect(screen.getByText(/3\/10 도서관/)).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("shows currently searching libraries", () => {
    const progress: SearchProgress = {
      totalLibraries: 5,
      completedLibraries: 2,
      searchingLibraries: ["판교", "동탄"],
      isSearchingAll: true,
    };

    render(<SearchProgressBar progress={progress} />);

    expect(screen.getByText(/판교, 동탄/)).toBeInTheDocument();
  });

  it("truncates long list of searching libraries", () => {
    const progress: SearchProgress = {
      totalLibraries: 10,
      completedLibraries: 2,
      searchingLibraries: ["판교", "동탄", "성남", "수지", "분당"],
      isSearchingAll: true,
    };

    render(<SearchProgressBar progress={progress} />);

    expect(screen.getByText(/판교, 동탄, 성남/)).toBeInTheDocument();
    expect(screen.getByText(/외 2곳/)).toBeInTheDocument();
  });

  it("shows completion message when all done", () => {
    const progress: SearchProgress = {
      totalLibraries: 5,
      completedLibraries: 5,
      searchingLibraries: [],
      isSearchingAll: true,
    };

    render(<SearchProgressBar progress={progress} />);

    expect(screen.getByText("검색 완료")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
