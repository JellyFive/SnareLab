import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MAX_ATTACHMENTS_PER_RECORD } from "../../services/imageAttachmentService";
import type { ImageAttachment } from "../../types";

interface ImageAttachmentGridProps {
  attachments: ImageAttachment[];
  errorMessage?: string;
  isLoading?: boolean;
  onAddFiles: (files: File[]) => void;
  onMove?: (attachmentId: string, targetIndex: number) => void;
  onRemove: (attachmentId: string) => void;
  editable?: boolean;
}

export function ImageAttachmentGrid({
  attachments,
  errorMessage,
  isLoading = false,
  onAddFiles,
  onMove,
  onRemove,
  editable = true,
}: ImageAttachmentGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_RECORD;

  return (
    <section aria-label="图片附件" className="image-attachment-grid">
      <div className="image-attachment-grid__tiles">
        {attachments.map((attachment, index) => (
          <AttachmentTile attachment={attachment} canMoveBackward={index > 0} canMoveForward={index < attachments.length - 1} editable={editable} key={attachment.id} onMove={onMove} onRemove={onRemove} position={index} />
        ))}
        {editable && <><input
          accept="image/*"
          aria-label="选择图片"
          className="image-attachment-grid__input"
          disabled={atLimit || isLoading}
          multiple
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            if (files.length) onAddFiles(files);
            event.currentTarget.value = "";
          }}
          ref={inputRef}
          type="file"
        />
        <button
          aria-label={atLimit ? `最多添加 ${MAX_ATTACHMENTS_PER_RECORD} 张图片` : "添加图片"}
          className="image-attachment-grid__add"
          disabled={atLimit || isLoading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={22} />
          <span>{isLoading ? "正在处理" : "添加图片"}</span>
        </button></>}
      </div>
      {atLimit && <p className="image-attachment-grid__hint">已达到 6 张图片上限</p>}
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    </section>
  );
}

function AttachmentTile({ attachment, canMoveBackward, canMoveForward, editable, onMove, onRemove, position }: { attachment: ImageAttachment; canMoveBackward: boolean; canMoveForward: boolean; editable: boolean; onMove?: (attachmentId: string, targetIndex: number) => void; onRemove: (attachmentId: string) => void; position: number }) {
  const source = useAttachmentUrl(attachment.blob);

  return (
    <article className="image-attachment-grid__tile">
      <img alt={`附件：${attachment.fileName}`} src={source} />
      {editable && <div className="image-attachment-grid__tools">
        {onMove && canMoveBackward && <button aria-label={`将${attachment.fileName}前移`} className="image-attachment-grid__move" onClick={() => onMove(attachment.id, position - 1)} type="button"><ArrowLeft aria-hidden="true" size={13} /></button>}
        {onMove && canMoveForward && <button aria-label={`将${attachment.fileName}后移`} className="image-attachment-grid__move" onClick={() => onMove(attachment.id, position + 1)} type="button"><ArrowRight aria-hidden="true" size={13} /></button>}
        <button aria-label={`删除${attachment.fileName}`} className="image-attachment-grid__remove" onClick={() => onRemove(attachment.id)} type="button"><X aria-hidden="true" size={14} /></button>
      </div>}
    </article>
  );
}

function useAttachmentUrl(blob: Blob): string | undefined {
  const [source, setSource] = useState<string>();

  useEffect(() => {
    if (typeof URL.createObjectURL !== "function") {
      setSource(undefined);
      return undefined;
    }

    const nextSource = URL.createObjectURL(blob);
    setSource(nextSource);
    return () => URL.revokeObjectURL(nextSource);
  }, [blob]);

  return source;
}
