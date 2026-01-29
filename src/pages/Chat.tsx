import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import { Menu, Sparkles, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll state
  const shouldAutoScrollRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }
    setConversations(data || []);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async () => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(
      data?.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) || []
    );

    // Reset scroll state when loading conversation
    shouldAutoScrollRef.current = true;
    requestAnimationFrame(() => {
      scrollToBottom(true);
    });
  }, [activeConversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom helper - ChatGPT style
  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (!shouldAutoScrollRef.current) return;

    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = true;
      const targetTop = el.scrollHeight;

      if (instant) {
        el.scrollTop = targetTop;
      } else {
        el.scrollTo({ top: targetTop, behavior: 'smooth' });
      }

      // Allow user scroll detection again after a short delay
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 100);
    });
  }, []);

  // Handle user scroll - detect if they scroll away from bottom
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Ignore programmatic scrolls
    if (isProgrammaticScrollRef.current) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;

    // Show/hide scroll button
    setShowScrollButton(distanceFromBottom > 200);

    // Update auto-scroll preference based on user position
    shouldAutoScrollRef.current = isNearBottom;
  }, []);

  // Auto-scroll on new messages (ChatGPT behavior)
  useEffect(() => {
    // Only scroll if user is near bottom
    if (shouldAutoScrollRef.current) {
      // Use instant scroll during streaming for smooth follow, smooth after
      scrollToBottom(isLoading);
    }
  }, [messages, isLoading, scrollToBottom]);

  // Create new conversation
  const createConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }

    setConversations((prev) => [data, ...prev]);
    setActiveConversationId(data.id);
    return data.id;
  };

  // Save message to database
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role, content });

    if (error) {
      console.error('Error saving message:', error);
    }

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

  // Handle sending message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Enable auto-scroll when user sends a message
    shouldAutoScrollRef.current = true;

    let convId = activeConversationId;

    if (!convId) {
      convId = await createConversation(content);
      if (!convId) return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(convId, 'user', content);

    const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to get response';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: fullContent } : m
                )
              );
            }
          } catch {
            // Incomplete JSON, skip
          }
        }
      }

      if (fullContent) {
        await saveMessage(convId, 'assistant', fullContent);
      }

      loadConversations();
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarCollapsed(true);
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase.from('conversations').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete conversation');
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleScrollToBottom = () => {
    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex w-full bg-background overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setSidebarCollapsed(true);
        }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative w-full min-w-0">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
          <motion.div
            className="absolute -top-40 left-1/4 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-[100px]"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 right-1/4 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-accent/8 blur-[100px]"
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[150px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Premium Header */}
        <header className="h-14 sm:h-16 border-b border-border/20 bg-background/60 backdrop-blur-2xl flex items-center px-3 sm:px-4 gap-3 sm:gap-4 relative z-20 flex-shrink-0">
          {/* Subtle header gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
          
          <motion.button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="relative p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border/30 transition-all duration-200 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
          </motion.button>
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div
              className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 relative overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5" />
              <div className="absolute inset-0 border border-primary/25 rounded-xl" />
              <Sparkles className="w-[18px] h-[18px] text-primary relative z-10" />
            </motion.div>
            
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-base sm:text-lg truncate text-foreground/90">
                {activeConversationId
                  ? conversations.find((c) => c.id === activeConversationId)?.title || 'Chat'
                  : 'New Chat'}
              </h1>
              {isLoading && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex gap-1">
                    <motion.span 
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span 
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.span 
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-xs text-primary/80 font-medium">Generating...</span>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative z-10 flex-1 overflow-y-auto scrollbar-thin min-h-0"
          style={{ overscrollBehavior: 'contain', overflowAnchor: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <WelcomeScreen key="welcome" onSuggestionClick={handleSendMessage} />
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-3 sm:space-y-4"
              >
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && msg.role === 'assistant' && index === messages.length - 1}
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                onClick={handleScrollToBottom}
                className="fixed bottom-28 sm:bottom-32 right-4 sm:right-6 z-30 p-3 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/25 backdrop-blur-sm border border-primary/50 transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="relative z-20 flex-shrink-0">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} disabled={!user} />
        </div>
      </main>
    </div>
  );
}
