import { useEffect, useMemo, useRef, useState } from "react";
import { EditorToolbar } from "../../features/editor/components/EditorToolbar";
import { MeasureControls } from "../../features/editor/components/MeasureControls";
import { RhythmGridCanvas } from "../../features/editor/components/RhythmGridCanvas";
import { TrackControlPanel } from "../../features/editor/components/TrackControlPanel";
import { TransportControls } from "../../features/editor/components/TransportControls";
import { appendMeasure, clearAllNotes, clearMeasure, removeMeasure, setDocumentBpm, setTrackMute, setTrackSolo, toggleNote } from "../../features/editor/domain/rhythmCommands";
import { TICKS_PER_MEASURE } from "../../features/editor/domain/rhythmConstants";
import { useEditorAudio } from "../../features/editor/hooks/useEditorAudio";
import type { EditorAudioEngine } from "../../features/editor/hooks/useEditorAudio";
import { useRhythmDocumentAutosave } from "../../features/editor/hooks/useRhythmDocumentAutosave";
import { RhythmDocumentRepository } from "../../repositories/rhythmDocumentRepository";
import { useEditorStore } from "../../store/editorStore";
import type { RhythmDocument, RhythmTrackId } from "../../types";

interface Props { repository?: RhythmDocumentRepository; stopPlayback?: () => void; createAudioEngine?: () => EditorAudioEngine }
const NOOP_STOP_PLAYBACK = () => undefined;
export function EditorPage({ repository: injectedRepository, stopPlayback = NOOP_STOP_PLAYBACK, createAudioEngine }: Props) {
  const repository = useMemo(() => injectedRepository ?? new RhythmDocumentRepository(), [injectedRepository]);
  const [documents, setDocuments] = useState<RhythmDocument[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState(0);
  const [cursorTick, setCursorTick] = useState(0);
  const [cursorTrackId, setCursorTrackId] = useState<RhythmTrackId>("hi-hat");
  const document = useEditorStore((state) => state.document);
  const undoStack = useEditorStore((state) => state.undoStack);
  const redoStack = useEditorStore((state) => state.redoStack);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const audio = useEditorAudio(document, { createEngine: createAudioEngine });
  const autosave = useRhythmDocumentAutosave({ document, repository });
  const autosaveRef = useRef(autosave);
  autosaveRef.current = autosave;
  const reload = async () => setDocuments(await repository.list());

  useEffect(() => { let active = true; void repository.resolveInitialDocument().then(async (initial) => { if (!active) return; useEditorStore.getState().openDocument(initial); setDocuments(await repository.list()); }); return () => { active = false; stopPlayback(); void autosaveRef.current.flush(); }; }, [repository, stopPlayback]);
  if (!document) return <section className="editor-page" aria-labelledby="editor-title"><h1 id="editor-title">节奏编辑器</h1><p>正在打开节奏文档…</p></section>;

  const resetView = () => { setSelectedMeasure(0); setCursorTick(0); setCursorTrackId("hi-hat"); };
  const stopAudio = () => { audio.stop(); stopPlayback(); };
  const canLeaveDocument = async () => { stopAudio(); return autosave.flush(); };
  const open = async (id: string) => { if (id === document.id) return; if (!(await canLeaveDocument())) return; const next = await repository.findById(id); if (!next) return; await repository.rememberLastDocument(id); useEditorStore.getState().openDocument(next); resetView(); };
  const apply = useEditorStore.getState().applyEdit;
  return <section className="editor-page" aria-labelledby="editor-title">
    <EditorToolbar documents={documents} activeDocument={document} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0} saveStatus={saveStatus}
      onSelectDocument={open} onCreateDocument={async () => { if (!(await canLeaveDocument())) return; const next = await repository.create(); await repository.rememberLastDocument(next.id); useEditorStore.getState().openDocument(next); resetView(); await reload(); }}
      onRenameDocument={async (name) => { const next = await repository.rename(document.id, name); useEditorStore.getState().replaceDocumentWithoutHistory(next); await reload(); }}
      onDeleteDocument={async () => { if (!(await canLeaveDocument())) return; const next = await repository.delete(document.id); useEditorStore.getState().openDocument(next); resetView(); await reload(); }}
      onUndo={useEditorStore.getState().undo} onRedo={useEditorStore.getState().redo} onRetrySave={async () => { await autosave.retry(); }} />
    <MeasureControls measureCount={document.measureCount} selectedMeasure={selectedMeasure} onSelect={setSelectedMeasure}
      onAdd={() => apply(appendMeasure)} onDelete={() => { apply((current) => removeMeasure(current, selectedMeasure)); setSelectedMeasure((value) => Math.max(0, Math.min(value, document.measureCount - 2))); }}
      onClear={() => apply((current) => clearMeasure(current, selectedMeasure))} onClearAll={() => apply(clearAllNotes)} />
    <TransportControls status={audio.status === "idle" ? "loading" : audio.status} bpm={document.bpm} loop={audio.loop ?? false} volume={audio.volume ?? 1} playheadTick={audio.playheadTick} error={audio.error}
      onPlay={() => void audio.play()} onPause={audio.pause} onStop={stopAudio}
      onBpmChange={(bpm) => { const current = useEditorStore.getState().document; if (!current) return; const next = setDocumentBpm(current, bpm); useEditorStore.getState().replaceDocumentWithoutHistory(next); audio.setBpm(bpm); }}
      onLoopChange={audio.setLoop} onVolumeChange={audio.setVolume} />
    <div className="editor-workspace"><TrackControlPanel tracks={document.tracks}
      onMute={(id, value) => { const current = useEditorStore.getState().document; if (!current) return; const next = setTrackMute(current, id, value); useEditorStore.getState().replaceDocumentWithoutHistory(next); audio.setDocument(next); }}
      onSolo={(id, value) => { const current = useEditorStore.getState().document; if (!current) return; const next = setTrackSolo(current, id, value); useEditorStore.getState().replaceDocumentWithoutHistory(next); audio.setDocument(next); }} />
      <div className="editor-grid-scroll"><RhythmGridCanvas document={document} cursorTick={cursorTick} cursorTrackId={cursorTrackId}
        playheadTick={audio.playheadTick}
        onCursorChange={(trackId, tick) => { setCursorTrackId(trackId); setCursorTick(tick); setSelectedMeasure(Math.floor(tick / TICKS_PER_MEASURE)); }}
        onToggleNote={(trackId, tick) => apply(toggleNote(trackId, tick))} /></div></div>
  </section>;
}
