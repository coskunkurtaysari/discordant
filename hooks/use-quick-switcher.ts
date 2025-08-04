"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchResult } from "@/components/navigation/quick-switcher-result-list";

export const useQuickSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Gerçek verileri çek
  const fetchResults = useCallback(async (searchQuery: string) => {
    try {
      // Boş sorgu kontrolü
      if (!searchQuery.trim()) {
        setResults([]);
        setSelectedIndex(0);
        return;
      }

      // Prefix kontrolü
      const prefix = searchQuery.charAt(0);
      const cleanQuery = searchQuery.slice(1).toLowerCase();
      
      // Sunucular
      const serversResponse = await fetch('/api/servers');
      const servers = serversResponse.ok ? await serversResponse.json() : [];

      // Kullanıcılar (arkadaşlar)
      const friendsResponse = await fetch('/api/friends');
      const friends = friendsResponse.ok ? await friendsResponse.json() : [];

      // Sonuçları birleştir
      const allResults: SearchResult[] = [];

      // Prefix filtreleme
      if (prefix === '*' || prefix === '#' || prefix === '!' || prefix === '@') {
        // Belirli prefix için filtreleme
        switch (prefix) {
          case '*':
            // Sunucular
            servers.forEach((server: any) => {
              if (server.name.toLowerCase().includes(cleanQuery)) {
                allResults.push({
                  id: server.id,
                  type: "server",
                  name: server.name,
                  description: `${server.members?.length || 0} üye`,
                  url: `/servers/${server.id}`,
                  tag: "SUNUCU"
                });
              }
            });
            break;
            
          case '@':
            // Kullanıcılar (arkadaşlar)
            friends.forEach((friend: any) => {
              const friendName = friend.friend?.profile?.name || friend.friend?.name || friend.profile?.name || friend.name;
              if (friendName && friendName.toLowerCase().includes(cleanQuery)) {
                allResults.push({
                  id: friend.friend?.id || friend.id,
                  type: "user",
                  name: friendName,
                  description: "Kullanıcı",
                  url: `/direct-messages/${friend.friend?.id || friend.id}`,
                  tag: "KULLANICI"
                });
              }
            });
            break;
            
          case '#':
            // Yazı kanalları
            servers.forEach((server: any) => {
              server.channels?.forEach((channel: any) => {
                if (channel.type === 'TEXT' && channel.name.toLowerCase().includes(cleanQuery)) {
                  allResults.push({
                    id: channel.id,
                    type: "channel",
                    name: channel.name,
                    description: `${server.name} sunucusu`,
                    url: `/servers/${server.id}/channels/${channel.id}`,
                    tag: "KANAL"
                  });
                }
              });
            });
            break;
            
          case '!':
            // Sesli kanalları
            servers.forEach((server: any) => {
              server.channels?.forEach((channel: any) => {
                if (channel.type === 'AUDIO' && channel.name.toLowerCase().includes(cleanQuery)) {
                  allResults.push({
                    id: channel.id,
                    type: "voice",
                    name: channel.name,
                    description: `${server.name} sunucusu`,
                    url: `/servers/${server.id}/channels/${channel.id}`,
                    tag: "SES"
                  });
                }
              });
            });
            break;
        }
      } else {
        // Prefix yoksa sadece sunucuları göster
        servers.forEach((server: any) => {
          if (server.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            allResults.push({
              id: server.id,
              type: "server",
              name: server.name,
              description: `${server.members?.length || 0} üye`,
              url: `/servers/${server.id}`,
              tag: "SUNUCU"
            });
          }
        });
      }

      setResults(allResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Error fetching results:", error);
      setResults([]);
    }
  }, []);

  // Arama sorgusu değiştiğinde sonuçları güncelle
  useEffect(() => {
    if (isOpen) {
      fetchResults(query);
    }
  }, [query, isOpen, fetchResults]);

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Navigasyon
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleSelect = async (result: SearchResult) => {
    try {
      switch (result.type) {
        case "user":
          // Kullanıcı için önce conversation oluştur
          const response = await fetch('/api/direct-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              memberTwoId: result.id,
              content: '' // Boş mesaj ile conversation başlat
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            router.push(`/direct-messages/${data.conversationId || data.id}`);
          } else {
            console.error('Failed to create conversation');
          }
          break;
          
        case "server":
          // Sunucuya yönlendir
          router.push(`/servers/${result.id}`);
          break;
          
        case "channel":
          // Yazı kanalına yönlendir
          router.push(result.url);
          break;
          
        case "voice":
          // Sesli kanala yönlendir
          router.push(result.url);
          break;
          
        default:
          // Varsayılan yönlendirme
          router.push(result.url);
          break;
      }
    } catch (error) {
      console.error('Error navigating to result:', error);
    }
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
    setResults([]);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    results,
    handleKeyDown,
    handleSelect,
    handleClose,
    handleOpen
  };
}; 