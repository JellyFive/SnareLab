export interface TransportControlsProps {
  status: "loading" | "ready" | "playing" | "paused" | "error";
  bpm: number;
  loop: boolean;
  volume: number;
  playheadTick: number;
  error?: string;
  onPlay(): void;
  onPause(): void;
  onStop(): void;
  onBpmChange(bpm: number): void;
  onLoopChange(loop: boolean): void;
  onVolumeChange(volume: number): void;
}

export function TransportControls(props: TransportControlsProps) {
  const canPlay = props.status === "ready" || props.status === "paused";
  const isPlaying = props.status === "playing";
  const [bpmInput, setBpmInput] = useState(String(props.bpm));
  useEffect(() => setBpmInput(String(props.bpm)), [props.bpm]);
  const commitBpm = () => {
    const value = Number(bpmInput);
    const nextBpm = Number.isFinite(value) ? Math.max(40, Math.min(240, Math.round(value))) : props.bpm;
    setBpmInput(String(nextBpm));
    props.onBpmChange(nextBpm);
  };

  return (
    <section className="transport-controls" aria-label="播放控制">
      <div className="transport-controls__actions">
        {isPlaying ? (
          <button className="button" onClick={props.onPause} type="button">暂停</button>
        ) : (
          <button className="button" disabled={!canPlay} onClick={props.onPlay} type="button">播放</button>
        )}
        <button
          className="button button--secondary"
          disabled={props.playheadTick === 0 && !isPlaying}
          onClick={props.onStop}
          type="button"
        >
          停止
        </button>
      </div>
      <label className="transport-controls__field">
        <span>速度</span>
        <input
          aria-label="速度 BPM"
          max={240}
          min={40}
          onBlur={commitBpm}
          onChange={(event) => setBpmInput(event.target.value)}
          type="number"
          value={bpmInput}
        />
        <output>{props.bpm} BPM</output>
      </label>
      <label className="transport-controls__toggle">
        <input aria-label="循环播放" checked={props.loop} onChange={(event) => props.onLoopChange(event.target.checked)} type="checkbox" />
        <span>循环</span>
      </label>
      <label className="transport-controls__field transport-controls__field--volume">
        <span>音量</span>
        <input aria-label="主音量" max="1" min="0" onChange={(event) => props.onVolumeChange(Number(event.target.value))} step="0.01" type="range" value={props.volume} />
        <output>{Math.round(props.volume * 100)}%</output>
      </label>
      {props.status === "loading" ? <p className="transport-controls__status" role="status">正在加载鼓组采样…</p> : null}
      {props.status === "error" && props.error ? <p className="transport-controls__error" role="alert">{props.error}</p> : null}
    </section>
  );
}
import { useEffect, useState } from "react";
