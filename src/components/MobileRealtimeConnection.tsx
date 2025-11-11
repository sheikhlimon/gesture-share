import React, { useState, useEffect, useRef } from 'react';

interface MobileConnectionProps {
  onConnection: (peerId: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  targetPeerId?: string;
}

declare global {
  interface Window {
    RTCPeerConnection: any;
    webkitRTCPeerConnection: any;
    mozRTCPeerConnection: any;
  }
}

const MobileRealtimeConnection: React.FC<MobileConnectionProps> = ({ 
  onConnection, 
  onDisconnect, 
  isConnected,
  targetPeerId
}) => {
  const [isReceiving, setIsReceiving] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [remoteDescription, setRemoteDescription] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [status, setStatus] = useState('Ready to connect');
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [localPeerId, setLocalPeerId] = useState('');
  const [connectionCandidates, setConnectionCandidates] = useState<string[]>([]);

  // Generate simple readable connection codes
  const generateConnectionCode = () => {
    const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
    const numbers = Math.floor(Math.random() * 999);
    const word = words[Math.floor(Math.random() * words.length)];
    return `${word}-${numbers}`;
  };

  // Start connection (mobile acts as receiver)
  const startReceiving = () => {
    setIsReceiving(true);
    setStatus('Waiting for connection code...');
  };

  // Process incoming connection - completely keyboard-free
  const processConnectionCode = async (code: string) => {
    try {
      setStatus('Processing connection...');
      
      // Simulate receiving connection data for the selected code
      const mockDescription = JSON.stringify({
        type: 'offer',
        sdp: 'mock-sdp-data-' + Date.now(),
        code: code
      });
      
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Listen for data channel
      peerConnection.current.ondatachannel = (event) => {
        const dataChannel = event.channel;
        console.log('Data channel received');
        
        dataChannel.onopen = () => {
          console.log('Data channel opened');
          setStatus('Connected! Ready to receive files');
          onConnection(code);
        };

        dataChannel.onmessage = (event) => {
          console.log('Message received:', event.data);
          // Handle file data
          if (event.data instanceof Blob) {
            // Handle file blob
            const fileName = `received_file_${Date.now()}`;
            const url = URL.createObjectURL(event.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
          }
        };
      };

      // Set remote description
      await peerConnection.current.setRemoteDescription({
        type: 'offer',
        sdp: 'mock-sdp-data'
      });

      // Create answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      setRemoteDescription(JSON.stringify({
        type: answer.type,
        sdp: answer.sdp,
        code: code
      }));

      setStatus('Connection established!');

    } catch (error) {
      console.error('Error processing connection:', error);
      setStatus('Failed to connect');
    }
  };

  // Create own connection for sharing
  const startInitiation = async () => {
    try {
      setIsInitiating(true);
      setStatus('Creating connection...');

      // Create a new peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Create data channel for file sharing
      peerConnection.current.createDataChannel('file-share', {
        ordered: true
      });

      // Create offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      const connectionCode = generateConnectionCode();
      setLocalPeerId(connectionCode);
      setLocalDescription(JSON.stringify({
        type: offer.type,
        sdp: offer.sdp,
        code: connectionCode
      }));
      
      setStatus('Share this connection code');
      
      // Listen for ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
        }
      };

    } catch (error) {
      console.error('Error starting connection:', error);
      setStatus('Failed to create connection');
      setIsInitiating(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  // Generate visual connection candidates for gesture selection
  useEffect(() => {
    const candidates = [];
    for (let i = 0; i < 9; i++) {
      candidates.push(generateConnectionCode());
    }
    setConnectionCandidates(candidates);
  }, []);

  // Auto-connect when targetPeerId is provided
  useEffect(() => {
    if (targetPeerId && !isConnected) {
      setIsReceiving(true);
      setStatus('Connecting to desktop...');
      processConnectionCode(targetPeerId);
    }
  }, [targetPeerId, isConnected]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile Connection</h3>
          <p className="text-gray-600 mb-1">No keyboard needed - tap to connect</p>
          <p className="text-sm text-gray-500">Status: {status}</p>
        </div>

        {!isInitiating && !isReceiving && !isConnected && (
          <div className="space-y-4">
            <button
              onClick={startReceiving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Receive Connection
            </button>
            <button
              onClick={startInitiation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Create Connection
            </button>
          </div>
        )}

        {isInitiating && localDescription && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Your Connection Code:</p>
              <div className="bg-white border border-blue-300 rounded p-3 mb-3">
                <p className="font-mono text-lg text-blue-800">{localPeerId}</p>
              </div>
              <p className="text-xs text-blue-700 mb-3">Share this code with another device</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(localDescription).then(() => {
                    setStatus('Connection data copied!');
                  });
                }}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors"
              >
                Copy Connection Data
              </button>
            </div>
            <button
              onClick={() => {
                setIsInitiating(false);
                setLocalDescription('');
                setLocalPeerId('');
                setStatus('Ready to connect');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {isReceiving && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-3">How to connect:</p>
              
              <div className="bg-white border border-gray-200 rounded p-3 mb-3">
                <p className="text-xs text-gray-600 mb-2">📞 Have someone say the code:</p>
                <p className="text-sm font-bold text-gray-800 mb-1">"ALPHA 123" or "BETA 456"</p>
                <p className="text-xs text-gray-500">Then tap the matching code below</p>
              </div>

              <div className="bg-white border border-gray-200 rounded p-3 mb-3">
                <p className="text-xs text-gray-600 mb-2">📱 Or copy/paste a shared code:</p>
                <button
                  onClick={() => {
                    navigator.clipboard.readText().then(text => {
                      if (text.includes('-')) {
                        processConnectionCode(text.trim());
                      }
                    }).catch(() => {
                      // Fallback for clipboard access denied
                    });
                  }}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-3 rounded transition-colors text-sm"
                >
                  📋 Paste from Clipboard
                </button>
              </div>

              <p className="text-xs text-green-700 font-medium mb-2">Or tap a common code:</p>
              <div className="grid grid-cols-3 gap-2">
                {connectionCandidates.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => processConnectionCode(code)}
                    className="bg-white hover:bg-green-50 border border-green-300 rounded p-3 text-xs font-mono text-green-800 transition-colors min-h-[60px] flex items-center justify-center"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setIsReceiving(false);
                setRemoteDescription('');
                setStatus('Ready to connect');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {isConnected && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-800 font-medium">Connected Successfully!</p>
              </div>
              <p className="text-sm text-green-700">Ready to receive files</p>
              <p className="text-xs text-green-600 mt-2">Files will be downloaded automatically</p>
            </div>
            <button
              onClick={() => {
                onDisconnect();
                setIsConnected(false);
                setIsInitiating(false);
                setIsReceiving(false);
                setLocalDescription('');
                setRemoteDescription('');
                setLocalPeerId('');
                setStatus('Ready to connect');
                if (peerConnection.current) {
                  peerConnection.current.close();
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileRealtimeConnection;
