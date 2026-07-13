export interface DistributionDonutItem {
  color: string;
  label: string;
  percentage: number;
  value: string;
}

interface DistributionDonutProps {
  centerLabel: string;
  centerValue: string;
  compact?: boolean;
  emptyMessage: string;
  items: DistributionDonutItem[];
  showTracks?: boolean;
}

export function DistributionDonut({ centerLabel, centerValue, compact = false, emptyMessage, items, showTracks = true }: DistributionDonutProps) {
  if (!items.length) return <p className="statistics-empty-state">{emptyMessage}</p>;

  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    cursor += item.percentage;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(", ");
  const summary = items.map((item) => `${item.label} ${item.value}，${item.percentage}%`).join("；");

  return (
    <article className={`distribution-card ${compact ? "distribution-card--compact" : ""}`}>
      <div className="distribution-card__chart-wrap">
        <div aria-label={`${centerLabel}分布：${summary}`} className="distribution-card__donut" role="img" style={{ background: `conic-gradient(${stops})` }}>
          <div className="distribution-card__center"><strong>{centerValue}</strong><span>{centerLabel}</span></div>
        </div>
      </div>
      <div className="distribution-card__list">
        {items.map((item) => (
          <article className="distribution-card__item" key={item.label}>
            <div className="distribution-card__line"><span className="distribution-card__dot" style={{ backgroundColor: item.color }} /><strong>{item.label}</strong><span>{item.value}</span><b>{item.percentage}%</b></div>
            {showTracks && <div aria-label={`${item.label} 占比 ${item.percentage}%`} className="distribution-card__track"><span style={{ backgroundColor: item.color, width: `${item.percentage}%` }} /></div>}
          </article>
        ))}
      </div>
    </article>
  );
}
