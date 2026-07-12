import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MAX_ATTACHMENTS_PER_RECORD } from "../../services/imageAttachmentService";
import type { ImageAttachment } from "../../types";

interface ImageAttachmentGridProps {
  attachments: ImageAttachment[];
  errorMessage?: string;
  isLoading?: boolean;
  onAddFiles: (files: File[]) => void;
  onRemove: (attachmentId: string) => void;
}

export function ImageAttachmentGrid({
  attachments,
  errorMessage,
  isLoading = false,
  onAddFiles,
  onRemove,
}: ImageAttachmentGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_RECORD;

  return (
    <section aria-label="图片附件" className="image-attachment-grid">
      <div className="image-attachment-grid__tiles">
        {attachments.map((attachment) => (
          <AttachmentTile attachment={attachment} key={attachment.id} onRemove={onRemove} />
        ))}
        <input
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
        </button>
      </div>
      {atLimit && <p className="image-attachment-grid__hint">已达到 6 张图片上限</p>}
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    </section>
  );
}

function AttachmentTile({ attachment, onRemove }: { attachment: ImageAttachment; onRemove: (attachmentId: string) => void }) {
  const source = useAttachmentUrl(attachment.blob);

  return (
    <article className="image-attachment-grid__tile">
      <img alt={`附件：${attachment.fileName}`} src={source} />
      <button aria-label={`删除${attachment.fileName}`} className="image-attachment-grid__remove" onClick={() => onRemove(attachment.id)} type="button">
        <X aria-hidden="true" size={14} />
      </button>
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
