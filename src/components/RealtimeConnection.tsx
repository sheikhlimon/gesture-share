import React, { useState, useEffect, useRef } from 'react';

interface ConnectionProps {
  onConnection: (peerId: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

declare global {
  interface Window {
    RTCPeerConnection: any;
    webkitRTCPeerConnection: any;
    mozRTCPeerConnection: any;
  }
}

const RealtimeConnection: React.FC<ConnectionProps> = ({ 
  onConnection, 
  onDisconnect, 
  isConnected 
}) => {
  const [isInitiating, setIsInitiating] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [localDescription, setLocalDescription] = useState('');
  const [remoteDescription, setRemoteDescription] = useState('');
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

  // Start new connection session
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

  // Join existing connection
  const startReceiving = () => {
    setIsReceiving(true);
    setStatus('Ready to receive connection code');
  };

  // Process incoming connection
  const processConnection = async (description: string) => {
    try {
      setStatus('Processing connection...');
      
      const sessionData = JSON.parse(description);
      
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
          onConnection(sessionData.code);
        };

        dataChannel.onmessage = (event) => {
          console.log('Message received:', event.data);
          // Handle file data
        };
      };

      // Set remote description
      await peerConnection.current.setRemoteDescription({
        type: sessionData.type,
        sdp: sessionData.sdp
      });

      // Create answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      setRemoteDescription(JSON.stringify({
        type: answer.type,
        sdp: answer.sdp,
        code: sessionData.code
      }));

      setStatus('Connection established!');

    } catch (error) {
      console.error('Error processing connection:', error);
      setStatus('Failed to connect');
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setStatus('Connection code copied!');
    }).catch(() => {
      setStatus('Failed to copy code');
    });
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
    for (let i = 0; i < 6; i++) {
      candidates.push(generateConnectionCode());
    }
    setConnectionCandidates(candidates);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Connection</h3>
          <p className="text-gray-600 mb-1">No keyboard required - use gestures or tap to connect</p>
          <p className="text-sm text-gray-500">Status: {status}</p>
        </div>

        {!isInitiating && !isReceiving && !isConnected && (
          <div className="space-y-4">
            <button
              onClick={startInitiation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Create Connection
            </button>
            <button
              onClick={startReceiving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Join Connection
            </button>
          </div>
        )}

        {isInitiating && localDescription && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Share This Code:</p>
              <div className="bg-white border border-blue-300 rounded p-4 mb-3">
                <p className="font-mono text-2xl text-blue-800 text-center">{localPeerId}</p>
              </div>
              <p className="text-xs text-blue-700 mb-3">Show this to the other device</p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => copyToClipboard(localPeerId)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-3 rounded transition-colors text-sm"
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Gesture Share Connection',
                        text: `Connect with code: ${localPeerId}`,
                      }).catch(() => copyToClipboard(localPeerId));
                    } else {
                      copyToClipboard(localPeerId);
                    }
                  }}
                  className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-3 rounded transition-colors text-sm"
                >
                  📱 Share Code
                </button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-600 mb-2">📞 Say it out loud:</p>
                <p className="text-sm font-bold text-gray-800">{localPeerId.toUpperCase()}</p>
                <p className="text-xs text-gray-500 mt-1">Example: "ALPHA ONE TWO THREE"</p>
              </div>
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
              <p className="text-sm font-medium text-green-900 mb-3">Select Connection Code:</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {connectionCandidates.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Simulate receiving this code
                      const mockDescription = JSON.stringify({
                        type: 'offer',
                        sdp: 'mock-sdp-data',
                        code: code
                      });
                      processConnection(mockDescription);
                    }}
                    className="bg-white hover:bg-green-50 border border-green-300 rounded p-2 text-sm font-mono text-green-800 transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
              <p className="text-xs text-green-700">Or wait for a connection code to be shared with you</p>
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
              <p className="text-sm text-green-700">Ready to share files</p>
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

export default RealtimeConnection;
