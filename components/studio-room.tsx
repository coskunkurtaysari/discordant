"use client";
import { useEffect, useState, useRef } from "react";
import { LiveKitRoom, VideoConference, RoomOptions, useRoom, useLocalParticipant } from "@livekit/components-react";
import "@livekit/components-styles";
import { useUser } from "@clerk/nextjs";
import { Loader2, Mic, MicOff, Video, VideoOff, Monitor, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StudioRoomProps {
  chatId: string;
  title?: string;
  description?: string;
}

export const StudioRoom = ({ chatId, title = "Live Studio", description }: StudioRoomProps) => {
  const { user } = useUser();
  const [token, setToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStats, setConnectionStats] = useState<any>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const displayName = user.fullName || 
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
      user.primaryEmailAddress?.emailAddress?.split('@')[0] || 
      user.id;

    const getToken = async () => {
      setIsConnecting(true);
      try {
        const response = await fetch(
          `/api/livekit?room=${chatId}&username=${encodeURIComponent(displayName)}&studio=true`
        );
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error("Studio token error:", error);
      } finally {
        setIsConnecting(false);
      }
    };

    getToken();
  }, [user, chatId]);

  // Studio-optimized room options
  const roomOptions: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    stopLocalTrackOnUnpublish: true,
    // Ultra-low latency settings
    videoCaptureDefaults: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 60, // Higher frame rate for studio
      facingMode: 'user'
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2
    },
    publishDefaults: {
      videoSimulcastLayers: [
        { width: 1920, height: 1080, fps: 60, quality: 100 },
        { width: 1280, height: 720, fps: 30, quality: 80 },
        { width: 640, height: 480, fps: 15, quality: 60 }
      ],
      videoCodec: 'h264',
      audioCodec: 'opus',
      dtx: true,
      red: true
    }
  };

  if (isConnecting || token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center bg-gradient-to-br from-[#7364c0] to-[#02264a] dark:from-[#000C2F] dark:to-[#003666]">
        <Loader2 className="h-8 w-8 text-white animate-spin mb-4" />
        <p className="text-white text-lg font-semibold">Connecting to Studio...</p>
        <p className="text-white/70 text-sm mt-2">Optimizing for low latency</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-[#7364c0] to-[#02264a] dark:from-[#000C2F] dark:to-[#003666]">
      <LiveKitRoom
        data-lk-theme="default"
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={true}
        audio={true}
        options={roomOptions}
      >
        <StudioInterface title={title} description={description} />
      </LiveKitRoom>
    </div>
  );
};

// Studio Interface Component
const StudioInterface = ({ title, description }: { title: string; description?: string }) => {
  const room = useRoom();
  const { localParticipant } = useLocalParticipant();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleAudio = async () => {
    if (localParticipant) {
      if (isAudioEnabled) {
        await localParticipant.setMicrophoneEnabled(false);
      } else {
        await localParticipant.setMicrophoneEnabled(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = async () => {
    if (localParticipant) {
      if (isVideoEnabled) {
        await localParticipant.setCameraEnabled(false);
      } else {
        await localParticipant.setCameraEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (localParticipant) {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Studio Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">{title}</h1>
            {description && (
              <p className="text-white/70 text-sm">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-green-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative">
        <VideoConference />
      </div>

      {/* Studio Controls */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "destructive" : "default"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-12 h-12"
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 