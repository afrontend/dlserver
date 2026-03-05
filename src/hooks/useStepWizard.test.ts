import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStepWizard } from "./useStepWizard";

describe("useStepWizard", () => {
  it("starts at step 1", () => {
    const { result } = renderHook(() => useStepWizard());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isStepCompleted(1)).toBe(false);
  });

  it("completes step and advances to next", () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.completeStep(1));
    expect(result.current.isStepCompleted(1)).toBe(true);
    expect(result.current.currentStep).toBe(2);
  });

  it("allows going back to edit a completed step", () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.completeStep(1));
    act(() => result.current.goToStep(1));
    expect(result.current.currentStep).toBe(1);
  });

  it("resets steps after edited step", () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.completeStep(1));
    act(() => result.current.completeStep(2));
    act(() => result.current.goToStep(1));
    expect(result.current.isStepCompleted(1)).toBe(false);
    expect(result.current.isStepCompleted(2)).toBe(false);
  });

  it("cannot go to step beyond current + 1", () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.goToStep(3));
    expect(result.current.currentStep).toBe(1);
  });

  it("reset goes back to step 1", () => {
    const { result } = renderHook(() => useStepWizard());
    act(() => result.current.completeStep(1));
    act(() => result.current.completeStep(2));
    act(() => result.current.reset());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isStepCompleted(1)).toBe(false);
  });
});
