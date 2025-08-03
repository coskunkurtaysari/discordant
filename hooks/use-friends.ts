import { useState, useEffect } from "react";

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "away" | "idle" | "dnd";
  avatar?: string;
  lastSeen?: string;
}

interface FriendRequest {
  id: string;
  name: string;
  sentAt: string;
  avatar?: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/friends');
        // const data = await response.json();
        
        // Mock data for now
        const mockFriends: Friend[] = [
          { id: "1", name: "Sahte Kullanıcı 1", status: "online" },
          { id: "2", name: "Sahte Kullanıcı 2", status: "online" },
        ];

        const mockRequests: FriendRequest[] = [
          { id: "1", name: "Sahte Kullanıcı 3", sentAt: "2 saat önce" },
          { id: "2", name: "Sahte Kullanıcı 4", sentAt: "1 gün önce" },
          { id: "3", name: "Sahte Kullanıcı 5", sentAt: "3 gün önce" },
          { id: "4", name: "Sahte Kullanıcı 6", sentAt: "5 gün önce" },
          { id: "5", name: "Sahte Kullanıcı 7", sentAt: "1 hafta önce" },
        ];

        setFriends(mockFriends);
        setPendingRequests(mockRequests);
      } catch (err) {
        setError("Arkadaşlar yüklenirken hata oluştu");
        console.error("Error fetching friends:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const addFriend = async (username: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/friends/add', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username })
      // });
      
      console.log("Friend request sent to:", username);
      return { success: true };
    } catch (err) {
      console.error("Error adding friend:", err);
      return { success: false, error: "Arkadaş eklenirken hata oluştu" };
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/friends/accept/${requestId}`, {
      //   method: 'POST'
      // });
      
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      return { success: true };
    } catch (err) {
      console.error("Error accepting friend request:", err);
      return { success: false, error: "İstek kabul edilirken hata oluştu" };
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/friends/reject/${requestId}`, {
      //   method: 'POST'
      // });
      
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      return { success: true };
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      return { success: false, error: "İstek reddedilirken hata oluştu" };
    }
  };

  return {
    friends,
    pendingRequests,
    isLoading,
    error,
    addFriend,
    acceptFriendRequest,
    rejectFriendRequest,
  };
}; 