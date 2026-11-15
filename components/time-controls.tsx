import { Pause, Play } from "lucide-react";

import { HOURS_PER_DAY, daysInMonth, firstDayOfMonth, formatHour } from "@/lib/time";

export type TimeControlsProps = {
  // The month on screen. 0 = January 2027. The slider covers its hours.
  visibleMonth: number;
  // Hour index counted from 2027-01-01 00:00 UTC.
  selectedHour: number;
  // True while time is running forward by itself.
  isPlaying: boolean;
  onTogglePlay: () => void;
  onChangeHour: (hour: number) => void;
};

// The controls that move the selected hour: a play button that runs time
// forward, and a slider across the month on screen.
export function TimeControls({
  visibleMonth,
  selectedHour,
  isPlaying,
  onTogglePlay,
  onChangeHour,
}: TimeControlsProps) {
  const firstHour = firstDayOfMonth(visibleMonth) * HOURS_PER_DAY;
  const lastHour = firstHour + daysInMonth(visibleMonth) * HOURS_PER_DAY - 1;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-pressed={isPlaying}
        // min-h-10 makes the button 40 px tall on a narrow screen, big enough for a thumb.
        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-md bg-neither px-2.5 py-1 text-sm text-bright lg:min-h-0"
      >
        {isPlaying && <Pause aria-hidden="true" className="size-3.5" />}
        {!isPlaying && <Play aria-hidden="true" className="size-3.5" />}
        {isPlaying ? "Pause" : "Play"}
      </button>

      {/* A plain range input: it can be dragged, and when it has focus the
          arrow keys move it one hour at a time. */}
      <input
        type="range"
        min={firstHour}
        max={lastHour}
        step={1}
        value={selectedHour}
        onChange={(event) => onChangeHour(Number(event.target.value))}
        aria-label="Hour of the month"
        aria-valuetext={formatHour(selectedHour)}
        className="h-1.5 min-w-0 flex-1 cursor-pointer accent-bright"
      />

      {/* Hidden on a narrow screen: a phone has no arrow keys, and the slider
          needs the room. */}
      <span className="hidden shrink-0 text-xs text-muted-foreground lg:inline">
        Arrow keys step one hour
      </span>
    </div>
  );
}
