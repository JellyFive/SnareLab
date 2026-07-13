export type CalendarHeatMapMode = "navigation" | "summary";

export interface CalendarHeatMapDatum {
  date: string;
  duration: number;
  sessionCount: number;
}

export interface CalendarHeatMapProps {
  data: CalendarHeatMapDatum[];
  labelStyle?: "english" | "chinese";
  mode: CalendarHeatMapMode;
  month: Date;
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
  showDuration?: boolean;
  weekStartsOnMonday?: boolean;
}

const SUNDAY_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONDAY_WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function CalendarHeatMap({
  data,
  labelStyle = "english",
  mode,
  month,
  onSelectDate,
  selectedDate,
  showDuration = false,
  weekStartsOnMonday = false,
}: CalendarHeatMapProps) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const durationByDate = new Map(data.map((item) => [item.date, item.duration]));
  const maximumDuration = Math.max(0, ...data.map((item) => item.duration));
  const firstDayOffset = weekStartsOnMonday ? (firstDay.getDay() + 6) % 7 : firstDay.getDay();
  const cells = Array.from({ length: firstDayOffset + lastDay.getDate() }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 ? new Date(month.getFullYear(), month.getMonth(), day) : undefined;
  });

  const monthLabel = formatMonth(month, labelStyle);

  return (
    <section className={`calendar-heatmap calendar-heatmap--${mode} ${showDuration ? "calendar-heatmap--with-duration" : ""}`} aria-label={`${monthLabel}练习热力图`}>
      <div className="calendar-heatmap__weekdays" aria-hidden="true">
        {(weekStartsOnMonday ? MONDAY_WEEKDAYS : SUNDAY_WEEKDAYS).map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-heatmap__grid">
        {cells.map((date, index) => {
          if (!date) {
            return <span className="calendar-heatmap__blank" key={`blank-${index}`} />;
          }

          const dateKey = toDateKey(date);
          const duration = durationByDate.get(dateKey) ?? 0;
          const intensity = calculateIntensity(duration, maximumDuration);
          const label = formatDay(date, labelStyle);
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
                <span>{date.getDate()}</span>{showDuration && duration > 0 && <small>{formatDuration(duration)}</small>}
              </button>
            );
          }

          return (
            <span
              aria-label={labelStyle === "chinese" ? `${label}，${intensity ? `练习强度 ${intensity}` : "无练习"}` : `${label}, intensity ${intensity}`}
              className={className}
              data-intensity={intensity}
              key={dateKey}
            >
              <span>{date.getDate()}</span>{showDuration && duration > 0 && <small>{formatDuration(duration)}</small>}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function formatMonth(date: Date, labelStyle: "english" | "chinese"): string {
  return labelStyle === "chinese"
    ? `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`
    : date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDay(date: Date, labelStyle: "english" | "chinese"): string {
  return labelStyle === "chinese"
    ? `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`
    : date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function calculateIntensity(duration: number, maximumDuration: number): number {
  if (duration <= 0 || maximumDuration <= 0) {
    return 0;
  }

  return Math.min(4, Math.max(1, Math.ceil((duration / maximumDuration) * 4)));
}

function formatDuration(duration: number): string {
  const hours = Math.floor(duration / 3_600);
  const minutes = Math.floor((duration % 3_600) / 60);
  if (minutes === 0 && hours > 0) return `${hours}小时`;
  return `${hours * 60 + minutes}分`;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
