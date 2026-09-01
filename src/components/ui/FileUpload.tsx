"use client";

import React, { useRef } from "react";
import { Upload, Loader2, File } from "lucide-react";

interface FileUploadProps {
  label?: string;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  fileName?: string;
}

export default function FileUpload({
  label,
  onFileSelect,
  isUploading = false,
  accept = "*",
  maxSizeMB = 5,
  fileName,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds limit of ${maxSizeMB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090] select-none">
          {label}
        </span>
      )}

      <div
        onClick={handleClick}
        className="border-2 border-dashed border-[#242424] hover:border-[var(--gm)] bg-[#161616] hover:bg-[#161616]/80 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3 relative group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gd)]" />
            <p className="text-xs text-[#909090]">Uploading your file...</p>
          </>
        ) : fileName ? (
          <>
            <File className="h-8 w-8 text-[var(--gd)]" />
            <div>
              <p className="text-xs font-semibold text-white">{fileName}</p>
              <p className="text-[10px] text-[#606060] mt-0.5">Click to replace file</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[#606060] group-hover:text-[var(--gd)] transition-colors" />
            <div>
              <p className="text-xs font-semibold text-white">Choose a file to upload</p>
              <p className="text-[10px] text-[#606060] mt-0.5">Supports format limit: max {maxSizeMB}MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
