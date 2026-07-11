export type CalendarHeatMapMode = "navigation" | "summary";

export interface CalendarHeatMapDatum {
  date: string;
  duration: number;
  sessionCount: number;
}

export interface CalendarHeatMapProps {
  data: CalendarHeatMapDatum[];
  mode: CalendarHeatMapMode;
  month: Date;
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarHeatMap({
  data,
  mode,
  month,
  onSelectDate,
  selectedDate,
}: CalendarHeatMapProps) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const durationByDate = new Map(data.map((item) => [item.date, item.duration]));
  const maximumDuration = Math.max(0, ...data.map((item) => item.duration));
  const cells = Array.from({ length: firstDay.getDay() + lastDay.getDate() }, (_, index) => {
    const day = index - firstDay.getDay() + 1;
    return day > 0 ? new Date(month.getFullYear(), month.getMonth(), day) : undefined;
  });

  return (
    <section className={`calendar-heatmap calendar-heatmap--${mode}`} aria-label="Practice calendar">
      <div className="calendar-heatmap__weekdays" aria-hidden="true">
        {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-heatmap__grid">
        {cells.map((date, index) => {
          if (!date) {
            return <span className="calendar-heatmap__blank" key={`blank-${index}`} />;
          }

          const dateKey = toDateKey(date);
          const intensity = calculateIntensity(durationByDate.get(dateKey) ?? 0, maximumDuration);
          const label = date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          const isSelected = selectedDate === dateKey;
          const className = [
            "calendar-heatmap__day",
            `calendar-heatmap__day--${intensity}`,
            isSelected ? "calendar-heatmap__day--selected" : "",
          ].filter(Boolean).join(" ");

          if (mode === "navigation") {
            return (
              <button
                aria-label={label}
                aria-pressed={isSelected}
                className={className}
                data-intensity={intensity}
                key={dateKey}
                onClick={() => onSelectDate?.(dateKey)}
                type="button"
              >
                {date.getDate()}
              </button>
            );
          }

          return (
            <span
              aria-label={`${label}, intensity ${intensity}`}
              className={className}
              data-intensity={intensity}
              key={dateKey}
            >
              {date.getDate()}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function calculateIntensity(duration: number, maximumDuration: number): number {
  if (duration <= 0 || maximumDuration <= 0) {
    return 0;
  }

  return Math.min(4, Math.max(1, Math.ceil((duration / maximumDuration) * 4)));
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
