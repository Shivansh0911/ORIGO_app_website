import { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { apiClient } from '../api/client';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  messageType: string;
  isDeleted: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl?: string };
}

interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}

export function useChat(conversationId: string) {
  const queryClient = useQueryClient();
  const { socket, emit } = useSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery<MessagesPage>({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const res = await apiClient.get<MessagesPage>(`/conversations/${conversationId}/messages`, {
        params: cursor ? { cursor } : {},
      });
      return res.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const messages = (data?.pages ?? []).flatMap((p) => p.messages);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_conversation', conversationId);

    const onNewMessage = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      queryClient.setQueryData(['messages', conversationId], (old: { pages: MessagesPage[] } | undefined) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastPage = pages[pages.length - 1];
        if (!lastPage || lastPage.messages.some((m) => m.id === msg.id)) return old;
        pages[pages.length - 1] = { ...lastPage, messages: [...lastPage.messages, msg] };
        return { ...old, pages };
      });
    };

    const onTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
    };

    const onStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStopTyping);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
    };
  }, [socket, conversationId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, { content });
      return res.data;
    },
    onMutate: async (content) => {
      setIsSending(true);
      return { content };
    },
    onSettled: () => setIsSending(false),
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    await sendMutation.mutateAsync(content);
    emit('typing_stop', conversationId);
  }, [sendMutation, emit, conversationId]);

  const onTypingStart = useCallback(() => {
    emit('typing_start', conversationId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emit('typing_stop', conversationId), 3000);
  }, [emit, conversationId]);

  const markRead = useCallback(async () => {
    await apiClient.patch(`/conversations/${conversationId}/read`).catch(() => {});
    emit('mark_read', conversationId);
  }, [conversationId, emit]);

  return { messages, sendMessage, loadMore: fetchNextPage, hasMore: hasNextPage, isLoading, typingUsers, isSending, onTypingStart, markRead };
}
