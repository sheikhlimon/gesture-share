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

export interface ConnectionState {
  peer: Peer.Instance | null;
  connections: Map<string, Peer.DataConnection>;
  fileTransfers: Map<string, FileTransfer>;
}

// Create initial connection state
export const createInitialState = (): ConnectionState => ({
  peer: null,
  connections: new Map(),
  fileTransfers: new Map(),
});

// Create a new Peer instance
export const createPeer = (): Promise<Peer.Instance> =>
  new Promise((resolve, reject) => {
    const peer = new Peer();

    peer.on("open", (peerId) => {
      console.log("My peer ID is:", peerId);
      resolve(peer);
    });

    peer.on("error", (error) => {
      console.error("PeerJS error:", error);
      reject(error);
    });
  });

// Initialize connection with Peer
export const initializeConnection = async (
  state: ConnectionState,
): Promise<ConnectionInfo> => {
  const peer = await createPeer();

  return {
    peerId: peer.id!,
    peer,
    connections: state.connections,
  };
};

// Connect to a peer
export const connectToPeer = (
  peer: Peer.Instance,
  connections: Map<string, Peer.DataConnection>,
  peerId: string,
): Promise<Peer.DataConnection> =>
  new Promise((resolve, reject) => {
    const connection = peer.connect(peerId);

    connection.on("open", () => {
      console.log("Connected to peer:", peerId);
      connections.set(peerId, connection);
      setupConnectionListeners(connection, connections);
      resolve(connection);
    });

    connection.on("error", (error) => {
      console.error("Connection error:", error);
      reject(error);
    });
  });

// Setup connection event listeners
export const setupConnectionListeners = (
  connection: Peer.DataConnection,
  connections: Map<string, Peer.DataConnection>,
  onFileChunk?: (data: {
    type: string;
    fileId: string;
    chunkIndex: number;
    chunk: ArrayBuffer;
    totalChunks: number;
  }) => void,
  onFileStart?: (data: {
    type: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    totalChunks: number;
  }) => void,
  onFileEnd?: (data: { type: string; fileId: string }) => void,
) => {
  connection.on("data", (data) => {
    if (data.type === "file-chunk") {
      onFileChunk?.(data);
    } else if (data.type === "file-start") {
      onFileStart?.(data);
    } else if (data.type === "file-end") {
      onFileEnd?.(data);
    }
  });

  connection.on("close", () => {
    connections.delete(connection.peer);
  });
};

// Send file through connection
export const sendFile = async (
  connection: Peer.DataConnection,
  file: File,
): Promise<void> => {
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

    // Small delay to prevent overwhelming connection
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Send file end signal
  connection.send({
    type: "file-end",
    fileId,
  });
};

// Handle file start
export const handleFileStart = (
  data: {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    totalChunks: number;
  },
  fileTransfers: Map<string, FileTransfer>,
): void => {
  const transfer: FileTransfer = {
    fileId: data.fileId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    fileType: data.fileType,
    chunks: [],
    totalChunks: data.totalChunks,
    receivedChunks: 0,
  };

  fileTransfers.set(data.fileId, transfer);
  console.log("Receiving file:", data.fileName);
};

// Handle file chunk
export const handleFileChunk = (
  data: {
    fileId: string;
    chunkIndex: number;
    chunk: ArrayBuffer;
    totalChunks: number;
  },
  fileTransfers: Map<string, FileTransfer>,
): void => {
  const transfer = fileTransfers.get(data.fileId);
  if (!transfer) return;

  transfer.chunks[data.chunkIndex] = data.chunk;
  transfer.receivedChunks++;

  // Progress callback could be added here
  const progress = (transfer.receivedChunks / transfer.totalChunks) * 100;
  console.log(`File transfer progress: ${progress.toFixed(2)}%`);
};

// Handle file end
export const handleFileEnd = (
  data: { fileId: string },
  fileTransfers: Map<string, FileTransfer>,
): void => {
  const transfer = fileTransfers.get(data.fileId);
  if (!transfer) return;

  // Reassemble file
  const completeFile = new Blob(transfer.chunks, { type: transfer.fileType });
  fileTransfers.delete(data.fileId);

  // Trigger download
  const url = URL.createObjectURL(completeFile);
  const a = document.createElement("a");
  a.href = url;
  a.download = transfer.fileName;
  a.click();
  URL.revokeObjectURL(url);

  console.log("File received and downloaded:", transfer.fileName);
};

// Listen for incoming connections
export const listenForConnections = (
  peer: Peer.Instance,
  connections: Map<string, Peer.DataConnection>,
  callback: (connection: Peer.DataConnection) => void,
): void => {
  peer.on("connection", (connection) => {
    console.log("Incoming connection from:", connection.peer);
    connections.set(connection.peer, connection);
    setupConnectionListeners(connection, connections);
    callback(connection);
  });
};

// Disconnect from a peer
export const disconnect = (
  connections: Map<string, Peer.DataConnection>,
  peerId: string,
): void => {
  const connection = connections.get(peerId);
  if (connection) {
    connection.close();
    connections.delete(peerId);
  }
};

// Close all connections
export const closeAll = (
  connections: Map<string, Peer.DataConnection>,
  peer: Peer.Instance | null,
): void => {
  connections.forEach((connection) => connection.close());
  connections.clear();

  if (peer) {
    peer.destroy();
  }
};

// Check if connected to any peers
export const isConnected = (
  connections: Map<string, Peer.DataConnection>,
): boolean => connections.size > 0;

// Get peer ID
export const getPeerId = (peer: Peer.Instance | null): string | null =>
  peer?.id || null;

// Connection manager factory
export const createConnectionManager = () => {
  const state = createInitialState();

  return {
    state,
    initializeConnection: () => initializeConnection(state),
    connectToPeer: (peerId: string) =>
      state.peer
        ? connectToPeer(state.peer, state.connections, peerId)
        : Promise.reject(new Error("Peer not initialized")),
    sendFile: (file: File) => {
      const connections = Array.from(state.connections.values());
      if (connections.length === 0) {
        throw new Error("No active connections");
      }
      return sendFile(connections[0], file);
    },
    listenForConnections: (
      callback: (connection: Peer.DataConnection) => void,
    ) => {
      if (!state.peer) {
        throw new Error("Peer not initialized");
      }
      listenForConnections(state.peer, state.connections, callback);
    },
    handleFileTransfer: (data: {
      type: string;
      fileId: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      totalChunks?: number;
      chunkIndex?: number;
      chunk?: ArrayBuffer;
    }) => {
      if (data.type === "file-start") {
        handleFileStart(data, state.fileTransfers);
      } else if (data.type === "file-chunk") {
        handleFileChunk(data, state.fileTransfers);
      } else if (data.type === "file-end") {
        handleFileEnd(data, state.fileTransfers);
      }
    },
    disconnect: (peerId: string) => disconnect(state.connections, peerId),
    close: () => closeAll(state.connections, state.peer),
    getPeerId: () => getPeerId(state.peer),
    isConnected: () => isConnected(state.connections),
  };
};

export default createConnectionManager;
