import type { RhythmTrack, RhythmTrackId } from "../../../types";
const names: Record<RhythmTrackId, string> = { "hi-hat": "踩镲 Hi-Hat", snare: "军鼓 Snare", kick: "底鼓 Kick", "tom-1": "嗵鼓 Tom 1", "tom-2": "嗵鼓 Tom 2", "tom-3": "嗵鼓 Tom 3", ride: "叮叮镲 Ride", crash: "强音镲 Crash" };
interface Props { tracks: RhythmTrack[]; onMute(id: RhythmTrackId, value: boolean): void; onSolo(id: RhythmTrackId, value: boolean): void }
export function TrackControlPanel({ tracks, onMute, onSolo }: Props) {
  return <aside aria-label="鼓组轨道" className="track-controls"><div className="track-controls__header">轨道</div>{tracks.map((track) => <div className="track-controls__row" key={track.id}><span>{names[track.id]}</span><button aria-label={`${names[track.id]} 轨道独奏`} aria-pressed={track.solo} onClick={() => onSolo(track.id, !track.solo)} type="button">S</button><button aria-label={`${names[track.id]} 轨道静音`} aria-pressed={track.mute} onClick={() => onMute(track.id, !track.mute)} type="button">M</button></div>)}</aside>;
}
