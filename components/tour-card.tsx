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
// bottom right corner, over the map, which no step points at.
// It fades and slides up when the tour opens. On each step the title and the
// text fade in: their key is the step number, so React draws them afresh and
// the fade plays again. The buttons stay still, so Next never moves away from
// the pointer.
export function TourCard({ step, stepIndex, stepCount, onBack, onNext, onClose }: TourCardProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stepCount - 1;

  return (
    // Below lg it sits just above the tab bar.
    <aside
      aria-label="Guided tour"
      aria-live="polite"
      className="fixed right-3 bottom-[4.25rem] z-40 lg:bottom-3 flex animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none w-[min(380px,calc(100vw-1.5rem))] flex-col gap-2 rounded-lg border-2 border-bright bg-panel px-4 py-3 text-sm shadow-xl"
    >
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          {stepIndex + 1} of {stepCount}
        </p>
        <h2
          key={stepIndex}
          className="animate-in fade-in duration-300 font-medium text-bright motion-reduce:animate-none"
        >
          {step.title}
        </h2>
        <button
          type="button"
          aria-label="Close the tour"
          onClick={onClose}
          // On a narrow screen the padding makes the cross easier to hit with a
          // thumb. The negative margins take the same space back, so nothing moves.
          className="-my-2 -mr-2 ml-auto rounded-sm p-2 text-base leading-none text-muted-foreground hover:text-bright lg:my-0 lg:mr-0 lg:px-1 lg:py-0"
        >
          ×
        </button>
      </div>

      <p
        key={stepIndex}
        className="animate-in fade-in duration-300 leading-relaxed text-foreground motion-reduce:animate-none"
      >
        {step.text}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          // min-h-10 makes the buttons 40 px tall on a narrow screen, big enough for a thumb.
          className="min-h-10 rounded-md bg-neither px-3 py-1 text-bright disabled:opacity-40 lg:min-h-0"
        >
          Back
        </button>
        {/* One button for Next and Finish, so the keyboard focus stays on it
            through the last step. It takes the focus when the tour opens: the
            header button that opened the tour is dimmed and cannot keep it. */}
        <button
          type="button"
          autoFocus
          onClick={isLast ? onClose : onNext}
          className="min-h-10 rounded-md bg-bright px-3 py-1 font-medium text-background lg:min-h-0"
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </aside>
  );
}
