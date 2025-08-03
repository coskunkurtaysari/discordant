import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  memberOne: {
    id: string;
    profile: {
      id: string;
      name: string;
      imageUrl: string;
      status?: string;
    };
  };
  memberTwo: {
    id: string;
    profile: {
      id: string;
      name: string;
      imageUrl: string;
      status?: string;
    };
  };
  directMessages: Array<{
    id: string;
    content: string;
    memberId: string;
    createdAt: Date;
  }>;
}

export const useDMs = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/direct-messages');
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await response.json();
        setConversations(data);
      } catch (err) {
        setError("Mesajlar yüklenirken hata oluştu");
        console.error("Error fetching conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const startConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberTwoId: userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      const newConversation = await response.json();
      setConversations(prev => [...prev, newConversation]);
      return { success: true, conversation: newConversation };
    } catch (err) {
      console.error("Error starting conversation:", err);
      return { success: false, error: "Konuşma başlatılırken hata oluştu" };
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/direct-messages/${conversationId}/read`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      
      return { success: true };
    } catch (err) {
      console.error("Error marking as read:", err);
      return { success: false, error: "Mesaj okundu olarak işaretlenirken hata oluştu" };
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/direct-messages/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      return { success: true };
    } catch (err) {
      console.error("Error deleting conversation:", err);
      return { success: false, error: "Konuşma silinirken hata oluştu" };
    }
  };

  return {
    conversations,
    isLoading,
    error,
    startConversation,
    markAsRead,
    deleteConversation,
  };
}; 