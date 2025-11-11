import Peer from "peerjs";

export interface ConnectionInfo {
  peerId: string;
  peer: Peer.Instance;
  connections: Map<string, Peer.DataConnection>;
}

export interface FileTransfer {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunks: ArrayBuffer[];
  totalChunks: number;
  receivedChunks: number;
}

class ConnectionManager {
  private static instance: ConnectionManager;
  private peer: Peer.Instance | null = null;
  private connections: Map<string, Peer.DataConnection> = new Map();
  private fileTransfers: Map<string, FileTransfer> = new Map();

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async createConnection(): Promise<ConnectionInfo> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on("open", (peerId) => {
        console.log("My peer ID is:", peerId);
        resolve({
          peerId,
          peer: this.peer!,
          connections: this.connections,
        });
      });

      this.peer.on("error", (error) => {
        console.error("PeerJS error:", error);
        reject(error);
      });
    });
  }

  async connectToPeer(peerId: string): Promise<Peer.DataConnection> {
    if (!this.peer) {
      throw new Error("Peer not initialized. Call createConnection first.");
    }

    return new Promise((resolve, reject) => {
      const connection = this.peer.connect(peerId);

      connection.on("open", () => {
        console.log("Connected to peer:", peerId);
        this.connections.set(peerId, connection);
        this.setupConnectionListeners(connection);
        resolve(connection);
      });

      connection.on("error", (error) => {
        console.error("Connection error:", error);
        reject(error);
      });
    });
  }

  private setupConnectionListeners(connection: Peer.DataConnection) {
    connection.on("data", (data) => {
      if (data.type === "file-chunk") {
        this.handleFileChunk(data);
      } else if (data.type === "file-start") {
        this.handleFileStart(data);
      } else if (data.type === "file-end") {
        this.handleFileEnd(data);
      }
    });

    connection.on("close", () => {
      this.connections.delete(connection.peer);
    });
  }

  async sendFile(connection: Peer.DataConnection, file: File): Promise<void> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chunkSize = 16384; // 16KB chunks

    // Send file metadata
    connection.send({
      type: "file-start",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks: Math.ceil(file.size / chunkSize),
    });

    // Send file in chunks
    const arrayBuffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
      const chunk = arrayBuffer.slice(start, end);

      connection.send({
        type: "file-chunk",
        fileId,
        chunkIndex: i,
        chunk,
        totalChunks,
      });

      // Small delay to prevent overwhelming the connection
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Send file end signal
    connection.send({
      type: "file-end",
      fileId,
    });
  }

  private handleFileStart(data: {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    totalChunks: number;
  }) {
    const transfer: FileTransfer = {
      fileId: data.fileId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      chunks: [],
      totalChunks: data.totalChunks,
      receivedChunks: 0,
    };

    this.fileTransfers.set(data.fileId, transfer);
    console.log("Receiving file:", data.fileName);
  }

  private handleFileChunk(data: {
    fileId: string;
    chunkIndex: number;
    chunk: ArrayBuffer;
    totalChunks: number;
  }) {
    const transfer = this.fileTransfers.get(data.fileId);
    if (!transfer) return;

    transfer.chunks[data.chunkIndex] = data.chunk;
    transfer.receivedChunks++;

    // Progress callback could be added here
    const progress = (transfer.receivedChunks / transfer.totalChunks) * 100;
    console.log(`File transfer progress: ${progress.toFixed(2)}%`);
  }

  private handleFileEnd(data: { fileId: string }) {
    const transfer = this.fileTransfers.get(data.fileId);
    if (!transfer) return;

    // Reassemble file
    const completeFile = new Blob(transfer.chunks, { type: transfer.fileType });
    this.fileTransfers.delete(data.fileId);

    // Trigger download
    const url = URL.createObjectURL(completeFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = transfer.fileName;
    a.click();
    URL.revokeObjectURL(url);

    console.log("File received and downloaded:", transfer.fileName);
  }

  listenForConnections(callback: (connection: Peer.DataConnection) => void) {
    if (!this.peer) {
      throw new Error("Peer not initialized. Call createConnection first.");
    }

    this.peer.on("connection", (connection) => {
      console.log("Incoming connection from:", connection.peer);
      this.connections.set(connection.peer, connection);
      this.setupConnectionListeners(connection);
      callback(connection);
    });
  }

  disconnect(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.close();
      this.connections.delete(peerId);
    }
  }

  close(): void {
    this.connections.forEach((connection) => connection.close());
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  getPeerId(): string | null {
    return this.peer?.id || null;
  }

  isConnected(): boolean {
    return this.connections.size > 0;
  }
}

export default ConnectionManager;
