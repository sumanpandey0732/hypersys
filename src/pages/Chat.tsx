import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import { Menu, Sparkles } from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const rafScrollRef = useRef<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
  }, [activeConversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current);

    rafScrollRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: isLoading ? 'auto' : 'smooth', block: 'end' });
    });

    return () => {
      if (rafScrollRef.current) cancelAnimationFrame(rafScrollRef.current);
    };
  }, [messages, isLoading]);

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
    
    setConversations(prev => [data, ...prev]);
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

    let convId = activeConversationId;
    
    if (!convId) {
      convId = await createConversation(content);
      if (!convId) return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(convId, 'user', content);

    const assistantMessage: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
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
              setMessages(prev =>
                prev.map(m =>
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
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
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
    
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex w-full bg-background overflow-hidden">
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
      <main className="flex-1 flex flex-col min-h-screen min-h-[100dvh] relative w-full">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
          <motion.div 
            className="absolute -top-32 left-1/4 h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96 rounded-full bg-primary/10 blur-3xl"
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute -bottom-32 right-1/4 h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96 rounded-full bg-primary/5 blur-3xl"
            animate={{ 
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Header */}
        <header className="h-14 sm:h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center px-3 sm:px-4 gap-3 sm:gap-4 relative z-20 flex-shrink-0">
          <motion.button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-xl hover:bg-secondary active:scale-95 transition-all"
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-base sm:text-lg truncate">
              {activeConversationId 
                ? conversations.find(c => c.id === activeConversationId)?.title || 'Chat'
                : 'New Chat'
              }
            </h2>
          </div>
        </header>

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative z-10 flex-1 overflow-y-auto scrollbar-thin overscroll-contain"
        >
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <WelcomeScreen key="welcome" onSuggestionClick={handleSendMessage} />
            ) : (
              <motion.div 
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6"
              >
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && msg.role === 'assistant' && !msg.content}
                  />
                ))}
                <div ref={messagesEndRef} className="h-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="relative z-20 flex-shrink-0">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            disabled={!user}
          />
        </div>
      </main>
    </div>
  );
}
