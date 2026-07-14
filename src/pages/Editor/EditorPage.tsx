import { useEffect, useMemo, useRef, useState } from "react";
import { EditorToolbar } from "../../features/editor/components/EditorToolbar";
import { MeasureControls } from "../../features/editor/components/MeasureControls";
import { RhythmGridCanvas } from "../../features/editor/components/RhythmGridCanvas";
import { TrackControlPanel } from "../../features/editor/components/TrackControlPanel";
import { appendMeasure, clearAllNotes, clearMeasure, removeMeasure, setTrackMute, setTrackSolo, toggleNote } from "../../features/editor/domain/rhythmCommands";
import { TICKS_PER_MEASURE } from "../../features/editor/domain/rhythmConstants";
import { useRhythmDocumentAutosave } from "../../features/editor/hooks/useRhythmDocumentAutosave";
import { RhythmDocumentRepository } from "../../repositories/rhythmDocumentRepository";
import { useEditorStore } from "../../store/editorStore";
import type { RhythmDocument, RhythmTrackId } from "../../types";

interface Props { repository?: RhythmDocumentRepository; stopPlayback?: () => void }
const NOOP_STOP_PLAYBACK = () => undefined;
export function EditorPage({ repository: injectedRepository, stopPlayback = NOOP_STOP_PLAYBACK }: Props) {
  const repository = useMemo(() => injectedRepository ?? new RhythmDocumentRepository(), [injectedRepository]);
  const [documents, setDocuments] = useState<RhythmDocument[]>([]);
  const [selectedMeasure, setSelectedMeasure] = useState(0);
  const [cursorTick, setCursorTick] = useState(0);
  const [cursorTrackId, setCursorTrackId] = useState<RhythmTrackId>("hi-hat");
  const document = useEditorStore((state) => state.document);
  const undoStack = useEditorStore((state) => state.undoStack);
  const redoStack = useEditorStore((state) => state.redoStack);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const autosave = useRhythmDocumentAutosave({ document, repository });
  const autosaveRef = useRef(autosave);
  autosaveRef.current = autosave;
  const reload = async () => setDocuments(await repository.list());

  useEffect(() => { let active = true; void repository.resolveInitialDocument().then(async (initial) => { if (!active) return; useEditorStore.getState().openDocument(initial); setDocuments(await repository.list()); }); return () => { active = false; stopPlayback(); void autosaveRef.current.flush(); }; }, [repository, stopPlayback]);
  if (!document) return <section className="editor-page" aria-labelledby="editor-title"><h1 id="editor-title">节奏编辑器</h1><p>正在打开节奏文档…</p></section>;

  const resetView = () => { setSelectedMeasure(0); setCursorTick(0); setCursorTrackId("hi-hat"); };
  const canLeaveDocument = async () => { stopPlayback(); return autosave.flush(); };
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
    <div className="editor-workspace"><TrackControlPanel tracks={document.tracks}
      onMute={(id, value) => useEditorStore.getState().replaceDocumentWithoutHistory(setTrackMute(document, id, value))}
      onSolo={(id, value) => useEditorStore.getState().replaceDocumentWithoutHistory(setTrackSolo(document, id, value))} />
      <div className="editor-grid-scroll"><RhythmGridCanvas document={document} cursorTick={cursorTick} cursorTrackId={cursorTrackId}
        onCursorChange={(trackId, tick) => { setCursorTrackId(trackId); setCursorTick(tick); setSelectedMeasure(Math.floor(tick / TICKS_PER_MEASURE)); }}
        onToggleNote={(trackId, tick) => apply(toggleNote(trackId, tick))} /></div></div>
  </section>;
}
