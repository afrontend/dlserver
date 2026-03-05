interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  isStepCompleted: (step: number) => boolean;
  onStepClick: (step: number) => void;
}

export const StepIndicator = ({
  steps,
  currentStep,
  isStepCompleted,
  onStepClick,
}: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center px-4 py-3">
      {steps.map((step, index) => {
        const completed = isStepCompleted(step.number);
        const active = currentStep === step.number;
        const clickable = completed;

        return (
          <div
            key={step.number}
            className="flex items-center"
            data-testid={`step-indicator-${step.number}`}
            onClick={() => clickable && onStepClick(step.number)}
            role={clickable ? "button" : undefined}
          >
            {index > 0 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 ${
                  completed || active ? "bg-blue-400" : "bg-gray-200"
                }`}
              />
            )}
            <div
              className={`flex flex-col items-center gap-1 ${
                clickable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div
                data-active={active || undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  completed
                    ? "bg-blue-500 text-white"
                    : active
                      ? "border-2 border-blue-500 text-blue-500 bg-white"
                      : "border-2 border-gray-300 text-gray-400 bg-white"
                }`}
              >
                {completed ? (
                  <i className="fa fa-check" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-xs ${
                  completed || active ? "text-blue-600 font-medium" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
