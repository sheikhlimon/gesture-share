import * as Peer from "peerjs";
import type { FileStart, FileChunk, FileEnd } from "../types";

export const sendFile = async (
  file: File,
  connection: Peer.DataConnection,
  onNotification: (type: "success" | "error", message: string) => void,
): Promise<void> => {
  try {
    const fileId = Date.now().toString();
    const fileStart: FileStart = {
      type: "file-start",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
    connection.send(fileStart);

    const chunkSize = 16384;
    const buffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(buffer.byteLength / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, buffer.byteLength);
      const chunk = buffer.slice(start, end);

      const fileChunk: FileChunk = {
        type: "file-chunk",
        fileId,
        chunkIndex: i,
        chunk: chunk,
      };
      connection.send(fileChunk);
    }

    const fileEnd: FileEnd = {
      type: "file-end",
      fileId,
    };
    connection.send(fileEnd);

    onNotification("success", `✅ ${file.name} sent successfully!`);
  } catch (error) {
    console.error("Failed to send file:", error);
    onNotification("error", `❌ Failed to send ${file.name}`);
  }
};

export const createFileInput = (
  onFileSelect: (file: File) => void,
  onCancel: () => void,
  accept: string = "image/*,.pdf,.doc,.docx,.txt",
): HTMLInputElement => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = accept;
  fileInput.style.position = "absolute";
  fileInput.style.left = "-9999px";
  fileInput.style.top = "-9999px";

  fileInput.onchange = (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileSelect(file);
    }
    document.body.removeChild(fileInput);
  };

  fileInput.oncancel = () => {
    onCancel();
    document.body.removeChild(fileInput);
  };

  document.body.appendChild(fileInput);
  return fileInput;
};
