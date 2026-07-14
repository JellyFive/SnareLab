import { useState } from "react";
import { MAX_MEASURES, MIN_MEASURES } from "../domain/rhythmConstants";
import { useDialogFocus } from "../../../hooks/useDialogFocus";

interface Props { measureCount: number; selectedMeasure: number; onSelect(index: number): void; onAdd(): void; onDelete(): void; onClear(): void; onClearAll(): void }
export function MeasureControls(props: Props) {
  const [confirm, setConfirm] = useState<"delete" | "clear" | "all">();
  const dialogRef = useDialogFocus(Boolean(confirm));
  const action = confirm === "delete" ? props.onDelete : confirm === "clear" ? props.onClear : props.onClearAll;
  return <div className="measure-controls">
    <label>当前小节<select aria-label="当前小节" value={props.selectedMeasure} onChange={(e) => props.onSelect(Number(e.target.value))}>{Array.from({ length: props.measureCount }, (_, index) => <option key={index} value={index}>第 {index + 1} 小节</option>)}</select></label>
    <button className="button button--secondary" disabled={props.measureCount >= MAX_MEASURES} title={props.measureCount >= MAX_MEASURES ? "最多 16 小节" : undefined} onClick={props.onAdd} type="button">添加小节</button>
    <button className="button button--secondary" disabled={props.measureCount <= MIN_MEASURES} title={props.measureCount <= MIN_MEASURES ? "至少保留 1 小节" : undefined} onClick={() => setConfirm("delete")} type="button">删除小节</button>
    <button className="button button--secondary" onClick={() => setConfirm("clear")} type="button">清空当前</button>
    <button className="button button--secondary" onClick={() => setConfirm("all")} type="button">清空全部</button>
    {confirm && <div className="editor-dialog-backdrop"><section aria-label="确认小节操作" aria-modal="true" className="editor-dialog" ref={dialogRef} role="dialog"><h2>确认{confirm === "delete" ? "删除小节" : "清空音符"}</h2><p>此操作可以通过撤销恢复。</p><div className="editor-dialog__actions"><button className="button button--secondary" data-dialog-initial-focus onClick={() => setConfirm(undefined)} type="button">取消</button><button className="button button--danger" onClick={() => { action(); setConfirm(undefined); }} type="button">确认操作</button></div></section></div>}
  </div>;
}
