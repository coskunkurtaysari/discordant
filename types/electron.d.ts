// Electron API Type Definitions
declare global {
  interface Window {
    electronAPI: {
      // Platform info
      platform: string;
      getVersion: () => string;
      
      // Window controls
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      
      // File system
      openFile: () => Promise<string>;
      
      // System info
      getSystemInfo: () => Promise<any>;
      
      // Notifications
      showNotification: (title: string, body: string) => void;
      
      // Studio-specific APIs
      requestMediaPermissions: () => Promise<boolean>;
      getHardwareInfo: () => Promise<any>;
      getPerformanceStats: () => Promise<{
        cpu: number;
        memory: number;
        gpu: number;
        fps: number;
      }>;
      startRecording: (options: {
        audio: boolean;
        video: boolean;
        quality: string;
      }) => Promise<void>;
      stopRecording: () => Promise<void>;
      getStudioSettings: () => Promise<any>;
      updateStudioSettings: (settings: any) => Promise<void>;
    };
  }
}

export {}; 