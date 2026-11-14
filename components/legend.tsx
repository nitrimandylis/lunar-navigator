// What the grid colours mean: one row of swatches under the grid.
export function Legend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-2 text-xs">
      <h3 className="sr-only">Legend</h3>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-xs bg-power" />
        Power: hours of sunlight
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-xs bg-comms" />
        Comms: hours Earth is in view for radio contact
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-xs border border-line bg-neither" />
        Neither
      </span>
      <span className="text-muted-foreground">
        Stronger colour means more hours that day. All times are UTC.
      </span>
    </div>
  );
}
