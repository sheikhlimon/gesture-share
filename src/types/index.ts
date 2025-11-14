export interface FileStart {
  type: "file-start";
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface FileChunk {
  type: "file-chunk";
  fileId: string;
  chunkIndex: number;
  chunk: ArrayBuffer;
}

export interface FileEnd {
  type: "file-end";
  fileId: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileId?: string;
}

export interface NotificationState {
  type: "success" | "error";
  message: string;
  show: boolean;
}

export type ConnectionStatus = "idle" | "connecting" | "connected";
