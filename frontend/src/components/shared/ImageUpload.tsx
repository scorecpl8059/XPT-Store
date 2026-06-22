"use client";

import React, { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  folder: "products" | "reviews" | "returns" | "categories";
  entityId: string;
  onUpload: (key: string, url: string) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({
  folder,
  entityId,
  onUpload,
  maxFiles = 5,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPEG, PNG, WebP, and GIF images are allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File must be under 5MB");
        return;
      }

      setUploading(true);
      setError("");

      try {
        const { uploadUrl, key } = await api.post<{
          uploadUrl: string;
          key: string;
        }>("/upload/presign", {
          folder,
          entityId,
          filename: file.name,
          contentType: file.type,
        });

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
        const url = cdnDomain
          ? `https://${cdnDomain}/${key}`
          : key;

        onUpload(key, url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, entityId, onUpload]
  );

  function handleFiles(files: FileList) {
    const count = Math.min(files.length, maxFiles);
    for (let i = 0; i < count; i++) {
      uploadFile(files[i]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 py-8 px-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          dragOver
            ? "border-ws-blue bg-ws-blue/5"
            : "border-ws-border hover:border-ws-blue/50 hover:bg-ws-surface",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <>
            <div className="h-8 w-8 border-2 border-ws-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ws-text-secondary">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-ws-text-muted" />
            <p className="text-sm text-ws-text-secondary">
              Drop images here or click to upload
            </p>
            <p className="text-xs text-ws-text-muted">
              JPEG, PNG, WebP, GIF — max 5MB
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-2 text-xs text-ws-red">{error}</p>
      )}
    </div>
  );
}

interface ImagePreviewProps {
  images: Array<{ key: string; url: string }>;
  onRemove: (key: string) => void;
}

export function ImagePreviewGrid({ images, onRemove }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {images.map((img) => (
        <div
          key={img.key}
          className="relative group aspect-square rounded-md overflow-hidden border border-ws-border bg-ws-surface"
        >
          <img
            src={img.url}
            alt=""
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(img.key)}
            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
