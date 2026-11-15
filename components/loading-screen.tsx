import { useState } from "react";

import { BuddyFigure } from "@/components/buddy";
import { cn } from "@/lib/utils";

// covers the page while the site data loads, so a slow start shows the
// buddy hovering instead of half-drawn panels. It is in the first HTML the
// server sends, so it is on screen before any script runs. When the data is
// in, it fades out and then leaves the page.
export function LoadingScreen({ isDone }: { isDone: boolean }) {
  const [isGone, setIsGone] = useState(false);
  if (isGone) {
    return null;
  }
  return (
    <div
      role="status"
      aria-live="polite"
      onTransitionEnd={(event) => {
        if (isDone && event.target === event.currentTarget) {
          setIsGone(true);
        }
      }}
      className={cn(
        "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-500 ease-out motion-reduce:transition-none",
        isDone && "pointer-events-none opacity-0",
      )}
    >
      <div aria-hidden="true" className="buddy-float w-24">
        <BuddyFigure looksUp={false} isGreeting={false} hasFlame />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-bright">Getting the Moon&apos;s south pole ready</p>
        <div aria-hidden="true" className="h-1 w-48 overflow-hidden rounded-full bg-neither">
          <div className="loading-bar h-full w-1/3 rounded-full bg-gradient-to-r from-power to-comms" />
        </div>
        <p className="font-mono text-xs text-muted-foreground">Sun and Earth, hour by hour, 2027 to 2040</p>
      </div>
    </div>
  );
}
