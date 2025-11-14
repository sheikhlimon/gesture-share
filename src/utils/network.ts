export const getConnectionUrl = async (): Promise<string> => {
  const hostname = window.location.hostname;
  const port = window.location.port || "5174";
  const isProduction =
    !hostname.includes("localhost") &&
    !hostname.includes("127.0.0.1") &&
    hostname !== "localhost";

  if (isProduction) {
    return `${window.location.protocol}//${hostname}${window.location.port ? `:${port}` : ""}`;
  } else {
    const localIP = await new Promise<string>((resolve) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pc.createDataChannel("");
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            setTimeout(() => {
              const lines = pc.localDescription?.sdp?.split("\n") || [];
              pc.close();

              for (const line of lines) {
                if (line.includes("candidate:") && line.includes("typ host")) {
                  const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                  if (
                    match &&
                    !match[0].startsWith("127.") &&
                    !match[0].startsWith("0.") &&
                    !match[0].startsWith("169.254")
                  ) {
                    resolve(match[0]);
                    return;
                  }
                }
              }
              resolve("");
            }, 2000);
          })
          .catch(() => resolve(""));
      } catch {
        resolve("");
      }
    });

    if (localIP) {
      return `http://${localIP}:${port}`;
    }

    return `http://localhost:${port}`;
  }
};
