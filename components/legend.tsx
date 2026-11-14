// What the grid colours mean.
export function Legend() {
  return (
    <div>
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
    </div>
  );
}
