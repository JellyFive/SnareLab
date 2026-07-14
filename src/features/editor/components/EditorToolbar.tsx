import { useState } from "react";
import { useDialogFocus } from "../../../hooks/useDialogFocus";
import type { RhythmDocument } from "../../../types";
import type { SaveStatus } from "../../../store/editorStore";

export interface EditorToolbarProps {
  documents: RhythmDocument[]; activeDocument: RhythmDocument; canUndo: boolean;
  canRedo: boolean; saveStatus: SaveStatus;
  onSelectDocument(id: string): Promise<void>; onCreateDocument(): Promise<void>;
  onRenameDocument(name: string): Promise<void>; onDeleteDocument(): Promise<void>;
  onUndo(): void; onRedo(): void; onRetrySave(): Promise<void>;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const [dialog, setDialog] = useState<"rename" | "delete">();
  const [name, setName] = useState(props.activeDocument.name);
  const [error, setError] = useState<string>();
  const dialogRef = useDialogFocus(Boolean(dialog));
  const saveText = { idle: "等待保存", saving: "保存中…", saved: "已保存", error: "保存失败" }[props.saveStatus];
  return <>
    <header className="editor-toolbar">
      <div className="editor-toolbar__identity"><p>Grid Editor</p><h1 id="editor-title">节奏编辑器</h1></div>
      <label className="editor-toolbar__selector"><span>节奏文档</span><select aria-label="选择节奏文档" value={props.activeDocument.id} onChange={(event) => void props.onSelectDocument(event.target.value)}>{props.documents.map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>
      <div className="editor-toolbar__actions">
        <button className="button button--secondary" onClick={() => void props.onCreateDocument()} type="button">新建</button>
        <button className="button button--secondary" onClick={() => { setName(props.activeDocument.name); setError(undefined); setDialog("rename"); }} type="button">重命名</button>
        <button aria-label="删除节奏" className="button button--secondary" onClick={() => setDialog("delete")} type="button">删除</button>
        <button aria-label="撤销" className="icon-button" disabled={!props.canUndo} onClick={props.onUndo} type="button">↶</button>
        <button aria-label="重做" className="icon-button" disabled={!props.canRedo} onClick={props.onRedo} type="button">↷</button>
      </div>
      <div className={`editor-toolbar__save editor-toolbar__save--${props.saveStatus}`} role="status">{saveText}{props.saveStatus === "error" && <button onClick={() => void props.onRetrySave()} type="button">重试保存</button>}</div>
    </header>
    {dialog && <div className="editor-dialog-backdrop"><section aria-modal="true" className="editor-dialog" ref={dialogRef} role="dialog" aria-labelledby="editor-dialog-title">
      {dialog === "rename" ? <><h2 id="editor-dialog-title">重命名节奏</h2><label>节奏名称<input aria-label="节奏名称" value={name} onChange={(event) => setName(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="editor-dialog__actions"><button className="button button--secondary" onClick={() => setDialog(undefined)} type="button">取消</button><button className="button" onClick={async () => { if (!name.trim()) { setError("请输入节奏名称"); return; } await props.onRenameDocument(name.trim()); setDialog(undefined); }} type="button">确认重命名</button></div></> : <><h2 id="editor-dialog-title">删除“{props.activeDocument.name}”</h2><p>删除后无法恢复；如果这是最后一个文档，将自动创建新节奏。</p><div className="editor-dialog__actions"><button className="button button--secondary" data-dialog-initial-focus onClick={() => setDialog(undefined)} type="button">取消</button><button className="button button--danger" onClick={async () => { await props.onDeleteDocument(); setDialog(undefined); }} type="button">确认删除节奏</button></div></>}
    </section></div>}
  </>;
}
