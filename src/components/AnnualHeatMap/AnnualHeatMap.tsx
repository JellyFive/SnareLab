import { toDateKey, type CalendarHeatMapDatum } from "../CalendarHeatMap";

export interface AnnualHeatMapProps {
  data: CalendarHeatMapDatum[];
  year: number;
}

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export function AnnualHeatMap({ data, year }: AnnualHeatMapProps) {
  const durationByDate = new Map(data.map((item) => [item.date, item.duration]));
  const maximumDuration = Math.max(0, ...data.map((item) => item.duration));
  const weeks = getCalendarWeeks(year);

  return (
    <section aria-label={`${year} 年练习热力图`} className="annual-heatmap">
      <div className="annual-heatmap__month-labels" aria-hidden="true">
        {Array.from({ length: 12 }, (_, month) => (
          <span key={month} style={{ gridColumnStart: weekIndexForMonth(year, month) + 1 }}>{month + 1} 月</span>
        ))}
      </div>
      <div className="annual-heatmap__calendar">
        <div aria-hidden="true" className="annual-heatmap__weekdays">{WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="annual-heatmap__weeks">
          {weeks.map((week, weekIndex) => (
            <div className="annual-heatmap__week" data-testid="annual-heatmap-week" key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (date.getFullYear() !== year) return <span aria-hidden="true" className="annual-heatmap__blank" key={dayIndex} />;
                const intensity = calculateIntensity(durationByDate.get(toDateKey(date)) ?? 0, maximumDuration);
                return <span aria-label={`${year} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日，${intensity ? `练习强度 ${intensity}` : "无练习"}`} className={`annual-heatmap__day annual-heatmap__day--${intensity}`} key={dayIndex} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="annual-heatmap__footer"><span aria-label="练习强度从少到多" className="annual-heatmap__legend">无练习<i /><i /><i /><i />120 分钟以上</span><p>热力图用于展示趋势，点击下方月份查看详情。</p></div>
    </section>
  );
}

function getCalendarWeeks(year: number): Date[][] {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  const firstMonday = new Date(year, 0, 1 - ((firstDay.getDay() + 6) % 7));
  const lastSunday = new Date(year, 11, 31 + (6 - ((lastDay.getDay() + 6) % 7)));
  const weeks: Date[][] = [];
  for (let cursor = firstMonday; cursor <= lastSunday; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7)) {
    weeks.push(Array.from({ length: 7 }, (_, day) => new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + day)));
  }
  return weeks;
}

function weekIndexForMonth(year: number, month: number): number {
  const date = new Date(year, month, 1);
  const firstMonday = new Date(year, 0, 1 - ((new Date(year, 0, 1).getDay() + 6) % 7));
  return Math.floor((date.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function calculateIntensity(duration: number, maximumDuration: number): number {
  if (duration <= 0 || maximumDuration <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((duration / maximumDuration) * 4)));
}
