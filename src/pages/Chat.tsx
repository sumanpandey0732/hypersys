import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import { Menu, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { isImageGenerationRequest, sanitizeAssistantText } from '@/lib/chat-format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const REQUEST_TIMEOUT_MS = 45_000;

export default function Chat() {
  const { user, isGuest } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedModel, setSelectedModel] = useState('default');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    setConversations(data || []);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!activeConversationId) { setMessages([]); return; }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true });
    setMessages(data?.map((m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })) || []);
  }, [activeConversationId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    const { data, error } = await supabase.from('conversations').insert({ user_id: user.id, title }).select().single();
    if (error) { toast.error('Failed to create conversation'); return null; }
    setConversations((prev) => [data, ...prev]);
    setActiveConversationId(data.id);
    return data.id;
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    await supabase.from('messages').insert({ conversation_id: conversationId, role, content });
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let convId = activeConversationId;
    const isAuthenticated = !!user && !isGuest;

    if (!convId && isAuthenticated) {
      convId = await createConversation(content);
      if (!convId) return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content };
    const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    const allMessages = [...messages, userMessage];

    setMessages([...messages, userMessage, assistantMessage]);

    if (convId && isAuthenticated) await saveMessage(convId, 'user', content);

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const isImageRequest = isImageGenerationRequest(content);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    let timeoutReached = false;
    let receivedAssistantContent = false;
    const timeoutId = setTimeout(() => {
      timeoutReached = true;
      abortControllerRef.current?.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const endpoint = isImageRequest
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const session = await supabase.auth.getSession();
        headers.Authorization = `Bearer ${session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
      } else {
        headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          prompt: content,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to get response';
        try {
          errorMsg = JSON.parse(errorText).error || errorMsg;
        } catch {
          // Ignore parse failures
        }
        throw new Error(errorMsg);
      }

      if (isImageRequest) {
        const data = await response.json();
        const generatedImageUrl = data.imageUrl || data?.data?.[0]?.url || null;

        if (!generatedImageUrl) {
          throw new Error(data.error || 'Failed to generate image');
        }

        const imageMessage = sanitizeAssistantText(data.message || 'Image generated successfully! ✨');
        const imageContent = `### **Generated image**\n\n![Generated Image](${generatedImageUrl})${imageMessage ? `\n\n${imageMessage}` : ''}`;

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: imageContent, imageUrl: generatedImageUrl } : m)),
        );
        receivedAssistantContent = true;

        if (convId && isAuthenticated) {
          await saveMessage(convId, 'assistant', imageContent);
        }
      } else {
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let fullContent = '';

        const pushDelta = (delta: string) => {
          if (!delta) return;
          fullContent += delta;
          receivedAssistantContent = true;

          const liveContent = sanitizeAssistantText(fullContent) || fullContent;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: liveContent } : m)),
          );
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });
          const lines = textBuffer.split('\n');
          textBuffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith(':') || !line.startsWith('data:')) continue;

            const payload = line.replace(/^data:\s*/, '');
            if (payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') pushDelta(delta);
            } catch {
              // Ignore malformed chunk and continue stream
            }
          }
        }

        if (textBuffer.trim().startsWith('data:')) {
          const payload = textBuffer.trim().replace(/^data:\s*/, '');
          if (payload !== '[DONE]') {
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') pushDelta(delta);
            } catch {
              // Ignore malformed final chunk
            }
          }
        }

        const cleaned = sanitizeAssistantText(fullContent);

        if (cleaned) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: cleaned } : m)),
          );

          if (convId && isAuthenticated) {
            await saveMessage(convId, 'assistant', cleaned);
          }
        } else {
          const fallback = 'I had a formatting hiccup—please send that once more 🙏';
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fallback } : m)),
          );
          if (convId && isAuthenticated) {
            await saveMessage(convId, 'assistant', fallback);
          }
        }
      }

      if (isAuthenticated) loadConversations();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (timeoutReached && !receivedAssistantContent) {
          const timeoutMessage = 'That took too long on my side—please send it again and I’ll keep it short.';
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: timeoutMessage } : m)),
          );
        }
      } else {
        console.error('Chat error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to send message');
        const errContent = 'Oops, something went wrong. Please try again!';
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: errContent } : m)),
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => { abortControllerRef.current?.abort(); };
  const handleNewConversation = () => { setActiveConversationId(null); setMessages([]); setSidebarCollapsed(true); };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) { toast.error('Failed to delete conversation'); return; }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) { setActiveConversationId(null); setMessages([]); }
  };

  const isAuthenticated = !!user && !isGuest;

  return (
    <div className="h-screen h-[100dvh] flex w-full bg-background overflow-hidden">
      {isAuthenticated && (
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => { setActiveConversationId(id); setSidebarCollapsed(true); }}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main className="flex-1 flex flex-col h-full relative w-full min-w-0">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
          <motion.div
            className="absolute -top-40 left-1/4 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-[100px]"
            animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 right-1/4 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-accent/8 blur-[100px]"
            animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-border/20 bg-background/60 backdrop-blur-2xl flex items-center px-3 sm:px-4 gap-3 sm:gap-4 relative z-20 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
          
          {isAuthenticated && (
            <motion.button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="relative p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border/30 transition-all duration-200 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </motion.button>
          )}
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div className="flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 relative overflow-hidden" whileHover={{ scale: 1.1, rotate: 5 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5" />
              <div className="absolute inset-0 border border-primary/25 rounded-xl" />
              <Sparkles className="w-[18px] h-[18px] text-primary relative z-10" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-base sm:text-lg truncate text-foreground/90">
                {activeConversationId ? conversations.find((c) => c.id === activeConversationId)?.title || 'Chat' : 'HyperSYS AI'}
              </h1>
              {isLoading && (
                <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: d }} />
                    ))}
                  </div>
                  <span className="text-xs text-primary/80 font-medium">Generating...</span>
                </motion.div>
              )}
              {isGuest && !isLoading && (
                <span className="text-xs text-muted-foreground/60">Guest mode • <a href="/auth" className="text-primary hover:underline">Sign in to save chats</a></span>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollContainerRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-thin min-h-0" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <WelcomeScreen key="welcome" onSuggestionClick={handleSendMessage} />
            ) : (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-3 sm:space-y-4">
                {messages.map((msg, index) => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content} isStreaming={isLoading && msg.role === 'assistant' && index === messages.length - 1} />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="relative z-20 flex-shrink-0">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} onStop={handleStopGeneration} />
        </div>
      </main>
    </div>
  );
}
