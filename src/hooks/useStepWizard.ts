import { useState, useCallback } from "react";

const TOTAL_STEPS = 3;

export const useStepWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isStepCompleted = useCallback(
    (step: number) => completedSteps.has(step),
    [completedSteps],
  );

  const completeStep = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
    if (step < TOTAL_STEPS) {
      setCurrentStep(step + 1);
    }
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step > currentStep) return;
      setCurrentStep(step);
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        for (let i = step; i <= TOTAL_STEPS; i++) {
          next.delete(i);
        }
        return next;
      });
    },
    [currentStep],
  );

  const reset = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
  }, []);

  return {
    currentStep,
    isStepCompleted,
    completeStep,
    goToStep,
    reset,
  };
};
