import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// A titled box. Every panel on the page uses it.
function Panel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("rounded-lg border border-line bg-panel p-4", className)}
    >
      <h2 className="mb-2 text-sm font-medium text-bright">{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-6 border-b border-line px-4 py-3">
        <h1 className="text-lg font-medium text-bright">
          Lunar Landing Site Navigator
        </h1>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            2027
          </span>
          <ul className="flex gap-1.5">
            {MONTHS.map((month) => {
              // January is shown as selected for now. Nothing is clickable yet.
              const isSelected = month === "Jan";
              return (
                <li
                  key={month}
                  aria-current={isSelected ? "true" : undefined}
                  className={cn(
                    "rounded-md bg-neither px-2.5 py-1 text-sm",
                    // Selection is a bright ring and a bright label. Other chips are never dimmed.
                    isSelected && "font-medium text-bright ring-2 ring-bright",
                  )}
                >
                  {month}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="ml-auto text-sm text-muted-foreground">
          Sort: both hours
        </p>
      </header>

      <main className="grid flex-1 grid-cols-[minmax(0,1fr)_380px] gap-4 p-4">
        <div className="flex flex-col gap-4">
          <Panel title="Sites" className="flex-1">
            <p className="text-sm text-muted-foreground">
              No sites loaded yet. Each site gets one row with a power lane and
              a comms lane, one cell per day.
            </p>
          </Panel>

          <Panel title="Clearance">
            <div className="flex flex-col gap-3">
              <div className="h-28 rounded-md border border-line p-3">
                <h3 className="text-sm text-foreground">Sun</h3>
                <p className="text-sm text-muted-foreground">
                  Degrees above or below the terrain horizon over time.
                </p>
              </div>
              <div className="h-28 rounded-md border border-line p-3">
                <h3 className="text-sm text-foreground">Earth</h3>
                <p className="text-sm text-muted-foreground">
                  Degrees above or below the terrain horizon over time.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Selected site">
            <p className="text-sm text-muted-foreground">
              No site selected. Solar elevation, time to sunset and time to
              Earthset will show here.
            </p>
          </Panel>

          <Panel title="South pole" className="flex-1">
            <p className="text-sm text-muted-foreground">
              The locator map will show here.
            </p>
          </Panel>

          <Panel title="Legend">
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-xs bg-power" />
                Power: hours of sunlight
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-xs bg-comms" />
                Comms: hours Earth is in view for radio contact
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-xs border border-line bg-neither" />
                Neither
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Stronger colour means more hours that day. All times are UTC.
            </p>
          </Panel>
        </div>
      </main>
    </div>
  );
}
