"use client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Mic, MicOff, Video, VideoOff, Monitor, Settings, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UltraLowLatencyRoomProps {
  chatId: string;
  title?: string;
}

export const UltraLowLatencyRoom = ({ chatId, title = "Ultra Low Latency Studio" }: UltraLowLatencyRoomProps) => {
  const { user } = useUser();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<string>("excellent");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ultra-low latency WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // TURN servers for NAT traversal (add your own)
      // { urls: 'turn:your-turn-server.com:3478', username: 'username', credential: 'password' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all',
    // Ultra-low latency settings
    sdpSemantics: 'unified-plan',
    // Force low latency codecs
    codecs: {
      audio: [
        { mimeType: 'audio/opus', clockRate: 48000, channels: 2, sdpFmtpLine: 'minptime=10;useinbandfec=1' }
      ],
      video: [
        { mimeType: 'video/H264', clockRate: 90000, parameters: { 'profile-level-id': '42e01f', 'level-asymmetry-allowed': '1' } }
      ]
    }
  };

  useEffect(() => {
    initializeUltraLowLatency();
    return () => cleanup();
  }, [chatId]);

  const initializeUltraLowLatency = async () => {
    try {
      // Get ultra-low latency media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
          // Ultra-low latency audio settings
          latency: 0.01, // 10ms target latency
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false
        },
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 60, max: 60 },
          // Ultra-low latency video settings
          latency: 0.01, // 10ms target latency
          googCpuOveruseDetection: true,
          googCpuOveruseDetectionMinFrames: 30,
          googCpuOveruseDetectionMaxFrames: 60
        }
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to signaling server
      connectToSignalingServer();
      
      // Start latency monitoring
      startLatencyMonitoring();

    } catch (error) {
      console.error('Error initializing ultra-low latency stream:', error);
    }
  };

  const connectToSignalingServer = () => {
    const wsUrl = process.env.NEXT_PUBLIC_ULTRA_LATENCY_WS_URL || 'ws://localhost:3001';
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log('Connected to ultra-low latency signaling server');
      socketRef.current?.send(JSON.stringify({
        type: 'join',
        roomId: chatId,
        userId: user?.id,
        username: user?.fullName || user?.id
      }));
    };

    socketRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      handleSignalingMessage(data);
    };

    socketRef.current.onclose = () => {
      console.log('Disconnected from signaling server');
      setIsConnected(false);
    };
  };

  const handleSignalingMessage = async (data: any) => {
    switch (data.type) {
      case 'user-joined':
        await createPeerConnection(data.userId);
        break;
      case 'user-left':
        removePeerConnection(data.userId);
        break;
      case 'offer':
        await handleOffer(data.userId, data.offer);
        break;
      case 'answer':
        await handleAnswer(data.userId, data.answer);
        break;
      case 'ice-candidate':
        await handleIceCandidate(data.userId, data.candidate);
        break;
    }
  };

  const createPeerConnection = async (userId: string) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current.set(userId, pc);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote streams
    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev.set(userId, event.streams[0])));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({
          type: 'ice-candidate',
          userId: userId,
          candidate: event.candidate
        }));
      }
    };

    // Monitor connection quality
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      setConnectionQuality(state === 'connected' ? 'excellent' : state);
    };

    // Create and send offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      
      socketRef.current?.send(JSON.stringify({
        type: 'offer',
        userId: userId,
        offer: offer
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (userId: string, offer: RTCSessionDescriptionInit) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current.set(userId, pc);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev.set(userId, event.streams[0])));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({
          type: 'ice-candidate',
          userId: userId,
          candidate: event.candidate
        }));
      }
    };

    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current?.send(JSON.stringify({
        type: 'answer',
        userId: userId,
        answer: answer
      }));
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (userId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (userId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const removePeerConnection = (userId: string) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }
  };

  const startLatencyMonitoring = () => {
    statsIntervalRef.current = setInterval(async () => {
      let totalLatency = 0;
      let connectionCount = 0;

      for (const [userId, pc] of peerConnections.current) {
        try {
          const stats = await pc.getStats();
          let rtt = 0;
          let count = 0;

          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) {
                rtt += report.currentRoundTripTime * 1000; // Convert to ms
                count++;
              }
            }
          });

          if (count > 0) {
            totalLatency += rtt / count;
            connectionCount++;
          }
        } catch (error) {
          console.error('Error getting stats:', error);
        }
      }

      if (connectionCount > 0) {
        const avgLatency = totalLatency / connectionCount;
        setLatency(Math.round(avgLatency));
      }
    }, 1000); // Update every second
  };

  const cleanup = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    peerConnections.current.forEach(pc => pc.close());
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-[#7364c0] to-[#02264a] dark:from-[#000C2F] dark:to-[#003666]">
      {/* Ultra Low Latency Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">{title}</h1>
            <p className="text-white/70 text-sm">Ultra-low latency streaming</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Latency Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                latency < 30 ? 'bg-green-500' : 
                latency < 100 ? 'bg-yellow-500' : 'bg-red-500'
              } animate-pulse`}></div>
              <span className="text-white text-sm font-mono">
                {latency}ms
              </span>
            </div>
            
            {/* Connection Quality */}
            <div className="flex items-center space-x-1">
              {connectionQuality === 'excellent' ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-white text-xs capitalize">{connectionQuality}</span>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center space-x-1 bg-red-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-medium">ULTRA LOW LATENCY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Local Video */}
          <div className="relative bg-black/20 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
              You (Local)
            </div>
          </div>

          {/* Remote Videos */}
          {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
            <div key={userId} className="relative bg-black/20 rounded-lg overflow-hidden">
              <video
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(el) => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                Remote User
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ultra Low Latency Controls */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={toggleAudio}
            variant="default"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Mic className="h-5 w-5" />
          </Button>

          <Button
            onClick={toggleVideo}
            variant="default"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Video className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Latency Display */}
          <div className="bg-black/30 px-4 py-2 rounded-full">
            <span className="text-white text-sm font-mono">
              {latency}ms Latency
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 