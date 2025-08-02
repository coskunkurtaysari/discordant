"use client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  Loader2, Mic, MicOff, Video, VideoOff, Monitor, Settings, 
  Wifi, WifiOff, Users, Share2, Square, Play, Pause,
  Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StudioChannelProps {
  channelId: string;
  channelName: string;
  serverName: string;
}

export const StudioChannel = ({ channelId, channelName, serverName }: StudioChannelProps) => {
  const { user } = useUser();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<string>("excellent");
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);

  // Ultra-low latency WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // TURN server from environment
      ...(process.env.NEXT_PUBLIC_ULTRA_LATENCY_TURN_SERVER ? [{
        urls: process.env.NEXT_PUBLIC_ULTRA_LATENCY_TURN_SERVER,
        username: process.env.NEXT_PUBLIC_ULTRA_LATENCY_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_ULTRA_LATENCY_TURN_CREDENTIAL
      }] : [])
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
  };

  useEffect(() => {
    initializeStudioChannel();
    return () => cleanup();
  }, [channelId]);

  const initializeStudioChannel = async () => {
    try {
      // Get ultra-low latency media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        },
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 60, max: 60 }
        }
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      connectToSignalingServer();
      startLatencyMonitoring();

    } catch (error) {
      console.error('Error initializing studio channel:', error);
    }
  };

  const connectToSignalingServer = () => {
    const wsUrl = process.env.NEXT_PUBLIC_ULTRA_LATENCY_WS_URL || 'ws://localhost:3001';
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log('Connected to studio signaling server');
      setIsConnected(true);
      socketRef.current?.send(JSON.stringify({
        type: 'join',
        roomId: channelId,
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
        setParticipantCount(prev => prev + 1);
        break;
      case 'user-left':
        removePeerConnection(data.userId);
        setParticipantCount(prev => Math.max(1, prev - 1));
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

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      setConnectionQuality(state === 'connected' ? 'excellent' : state);
    };

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
                rtt += report.currentRoundTripTime * 1000;
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
    }, 1000);
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
    if (recordingRef.current) {
      recordingRef.current.stop();
    }
  };

  // Studio Controls
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setIsScreenSharing(true);
        // Handle screen sharing stream
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recordingRef.current) {
        recordingRef.current.stop();
        setIsRecording(false);
      }
    } else {
      if (localStream) {
        recordingRef.current = new MediaRecorder(localStream);
        recordingRef.current.start();
        setIsRecording(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-[#7364c0] to-[#02264a] dark:from-[#000C2F] dark:to-[#003666]">
      {/* Studio Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">{channelName}</h1>
            <p className="text-white/70 text-sm">{serverName} Studio</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}></div>
              <span className="text-white text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

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

            {/* Participants */}
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-white" />
              <span className="text-white text-sm">{participantCount}</span>
            </div>

            {/* Studio Badge */}
            <Badge variant="destructive" className="bg-red-500/20 text-red-400">
              STUDIO
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
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
                         {isRecording && (
               <div className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded text-white text-xs flex items-center space-x-1">
                 <CircleDot className="h-3 w-3" />
                 <span>REC</span>
               </div>
             )}
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

      {/* Studio Controls */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Controls */}
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>

          {/* Video Controls */}
          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "destructive" : "outline"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          {/* Recording */}
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            className="rounded-full w-12 h-12"
                     >
             {isRecording ? <Square className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
           </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Fullscreen */}
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
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