import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "away" | "idle" | "dnd";
  avatar?: string;
  email?: string;
  createdAt?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  sentAt: string;
  avatar?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn, userId } = useAuth();

  // Arkadaş listesini yeniden yükleme fonksiyonu
  const refreshFriends = async () => {
      try {
        setIsLoading(true);
      setError(null);
      
      if (!isSignedIn || !userId) {
        console.log("User not authenticated");
        setFriends([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/friends', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setFriends(data);
        console.log("Friends loaded:", data);
      } else {
        setFriends([]);
      }
      } catch (err) {
        console.error("Error fetching friends:", err);
      setFriends([]);
      setError(null);
      } finally {
        setIsLoading(false);
      }
    };

  // İlk yükleme
  useEffect(() => {
    refreshFriends();
  }, [isSignedIn, userId]);

  // Real-time güncelleme için interval (her 30 saniyede bir)
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const interval = setInterval(() => {
      refreshFriends();
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [isSignedIn, userId]);

  const addFriend = async (username: string): Promise<ApiResponse<any>> => {
    try {
      if (!isSignedIn || !userId) {
        return { 
          success: false, 
          error: "Giriş yapmanız gerekiyor" 
        };
      }

      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      // Arkadaş başarıyla eklendiyse listeyi hemen yenile
      if (data.success) {
        await refreshFriends();
      }

      return { 
        success: true, 
        data: data,
        message: data.message 
      };
    } catch (err) {
      console.error("Error adding friend:", err);
      return { success: false, error: "Arkadaş eklenirken hata oluştu" };
    }
  };

  const removeFriend = async (friendId: string): Promise<ApiResponse<any>> => {
    try {
      if (!isSignedIn || !userId) {
        return { 
          success: false, 
          error: "Giriş yapmanız gerekiyor" 
        };
      }

      const response = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const data = await response.json();
        return { 
          success: false, 
          error: data.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      // Arkadaş başarıyla çıkarıldıysa listeyi hemen yenile
      const data = await response.json();
      if (data.success) {
        await refreshFriends();
      }
      
      return { success: true };
    } catch (err) {
      console.error("Error removing friend:", err);
      return { success: false, error: "Arkadaş çıkarılırken hata oluştu" };
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<ApiResponse<any>> => {
    try {
      // TODO: Implement accept friend request API
      console.log("Accepting friend request:", requestId);
      return { success: true, message: "Arkadaşlık isteği kabul edildi" };
    } catch (err) {
      console.error("Error accepting friend request:", err);
      return { success: false, error: "Arkadaşlık isteği kabul edilirken hata oluştu" };
    }
  };

  const rejectFriendRequest = async (requestId: string): Promise<ApiResponse<any>> => {
    try {
      // TODO: Implement reject friend request API
      console.log("Rejecting friend request:", requestId);
      return { success: true, message: "Arkadaşlık isteği reddedildi" };
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      return { success: false, error: "Arkadaşlık isteği reddedilirken hata oluştu" };
    }
  };

  return {
    friends,
    pendingRequests,
    isLoading,
    error,
    addFriend,
    removeFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshFriends, // Manuel yenileme için export ediyoruz
  };
}; 