import React, { useState, useRef, useEffect } from "react";

interface FileItem {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface FileSelectorProps {
  onSelect: (file: File) => void;
  onClose: () => void;
  isVisible: boolean;
  selectedIndex: number;
  onFilesChange: (files: File[]) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onSelect,
  onClose,
  isVisible,
  selectedIndex,
  onFilesChange,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      // Trigger file input when modal opens
      fileInputRef.current?.click();
    }
  }, [isVisible]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileItems: FileItem[] = Array.from(selectedFiles).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));
      setFiles(fileItems);
      onFilesChange(Array.from(selectedFiles));
    }
  };

  const handleSelectFile = (file: File) => {
    onSelect(file);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-800 p-6 rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Select File</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          multiple
        />

        {files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No files selected</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Browse Files
            </button>
            <div className="mt-8 text-sm text-gray-400">
              <p>Gesture controls:</p>
              <p>👍 Thumbs up - Select file</p>
              <p>✌️ Peace - Show QR</p>
              <p>☝️ Point - Navigate</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === selectedIndex % files.length
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    }`}
                    onClick={() => handleSelectFile(fileItem.file)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium truncate">{fileItem.name}</p>
                        <p className="text-sm opacity-75">
                          {formatFileSize(fileItem.size)} • {fileItem.type}
                        </p>
                      </div>
                      {index === selectedIndex % files.length && (
                        <span className="ml-2">→</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                Add More Files
              </button>
              <div className="text-sm text-gray-400">
                {files.length > 0 && (
                  <p>
                    Press 👍 to select:{" "}
                    {files[selectedIndex % files.length].name}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
