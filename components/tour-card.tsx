import type { TourStep } from "@/lib/tour";

export type TourCardProps = {
  step: TourStep;
  // Which step this is, counted from 0, and how many there are.
  stepIndex: number;
  stepCount: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
};

// The card that tells the guided tour, one step at a time. It sits in the
// bottom right corner, over the custom point form, which no step points at.
export function TourCard({ step, stepIndex, stepCount, onBack, onNext, onClose }: TourCardProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stepCount - 1;

  return (
    <aside
      aria-label="Guided tour"
      aria-live="polite"
      className="fixed right-3 bottom-3 z-40 flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-2 rounded-lg border-2 border-bright bg-panel px-4 py-3 text-sm shadow-xl"
    >
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          {stepIndex + 1} of {stepCount}
        </p>
        <h2 className="font-medium text-bright">{step.title}</h2>
        <button
          type="button"
          aria-label="Close the tour"
          onClick={onClose}
          className="ml-auto rounded-sm px-1 text-base leading-none text-muted-foreground hover:text-bright"
        >
          ×
        </button>
      </div>

      <p className="leading-relaxed text-foreground">{step.text}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="rounded-md bg-neither px-3 py-1 text-bright disabled:opacity-40"
        >
          Back
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-bright px-3 py-1 font-medium text-background"
          >
            Next
          </button>
        )}
        {isLast && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-bright px-3 py-1 font-medium text-background"
          >
            Finish
          </button>
        )}
      </div>
    </aside>
  );
}
