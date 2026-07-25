"use client";

import { useRef, useState } from "react";
import { Paperclip, X, FileCode, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

interface FileAttachmentProps {
  attachedFiles: AttachedFile[];
  onAddFiles: (files: AttachedFile[]) => void;
  onRemoveFile: (fileId: string) => void;
  disabled?: boolean;
}

export function FileAttachment({
  attachedFiles,
  onAddFiles,
  onRemoveFile,
  disabled,
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttached: AttachedFile[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`File ${file.name} is too large (> 5MB).`);
        continue;
      }

      try {
        const text = await file.text();
        newAttached.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || getExtensionType(file.name),
          content: text,
        });
      } catch (err) {
        console.error("Error reading file:", err);
        toast.error(`Could not read file ${file.name}`);
      }
    }

    if (newAttached.length > 0) {
      onAddFiles(newAttached);
      toast.success(`Attached ${newAttached.length} file(s)`);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getExtensionType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["js", "ts", "tsx", "jsx", "py", "cpp", "c", "java", "rs", "go", "html", "css", "json", "sql"].includes(ext || "")) {
      return "code";
    }
    return "text";
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.cpp,.c,.h,.hpp,.java,.rs,.go,.css,.scss,.html,.xml,.csv,.sql"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="h-12 w-12 rounded-xl bg-neutral-900 border border-white/10 hover:border-white/20 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Attach Code or Document Files (.py, .js, .cpp, .json, .md, .txt)"
      >
        <Paperclip className="w-4 h-4" />
      </button>
    </div>
  );
}

export function FilePillsList({
  attachedFiles,
  onRemoveFile,
}: {
  attachedFiles: AttachedFile[];
  onRemoveFile: (id: string) => void;
}) {
  if (attachedFiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pt-1 pb-2">
      {attachedFiles.map((file) => {
        const isCode = file.type === "code" || file.name.match(/\.(js|ts|tsx|py|cpp|java|rs|go|json|html|css)$/i);
        return (
          <div
            key={file.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-mono text-neutral-200 group animate-in fade-in zoom-in-95 duration-200"
          >
            {isCode ? (
              <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="truncate max-w-[140px] font-semibold">{file.name}</span>
            <span className="text-[10px] text-neutral-500">
              ({(file.size / 1024).toFixed(1)}KB)
            </span>
            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="text-neutral-500 hover:text-red-400 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
