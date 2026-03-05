import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepIndicator } from "./StepIndicator";

describe("StepIndicator", () => {
  const steps = [
    { number: 1, label: "책 이름" },
    { number: 2, label: "도서관" },
    { number: 3, label: "검색" },
  ];

  it("renders all step labels", () => {
    render(
      <StepIndicator
        steps={steps}
        currentStep={1}
        isStepCompleted={() => false}
        onStepClick={() => {}}
      />,
    );

    expect(screen.getByText("책 이름")).toBeInTheDocument();
    expect(screen.getByText("도서관")).toBeInTheDocument();
    expect(screen.getByText("검색")).toBeInTheDocument();
  });

  it("marks current step as active", () => {
    render(
      <StepIndicator
        steps={steps}
        currentStep={2}
        isStepCompleted={(s) => s === 1}
        onStepClick={() => {}}
      />,
    );

    const step2 = screen.getByTestId("step-indicator-2");
    expect(step2.querySelector("[data-active]")).toBeTruthy();
  });

  it("marks completed steps with check", () => {
    render(
      <StepIndicator
        steps={steps}
        currentStep={2}
        isStepCompleted={(s) => s === 1}
        onStepClick={() => {}}
      />,
    );

    const step1 = screen.getByTestId("step-indicator-1");
    expect(step1.querySelector(".fa-check")).toBeTruthy();
  });

  it("calls onStepClick for completed steps", async () => {
    const onStepClick = vi.fn();
    const user = userEvent.setup();

    render(
      <StepIndicator
        steps={steps}
        currentStep={2}
        isStepCompleted={(s) => s === 1}
        onStepClick={onStepClick}
      />,
    );

    await user.click(screen.getByTestId("step-indicator-1"));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });
});
