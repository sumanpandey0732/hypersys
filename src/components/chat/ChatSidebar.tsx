import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, LogOut, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ChatSidebar({
  conversations, activeConversationId, onSelectConversation,
  onNewConversation, onDeleteConversation, isCollapsed, onToggleCollapse,
}: ChatSidebarProps) {
  const { user, signOut } = useAuth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onToggleCollapse} />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 0 : 280, x: isCollapsed ? -280 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed lg:relative h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col overflow-hidden"
      >
        <div className="flex flex-col h-full w-[280px]">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display font-bold text-lg gradient-text">HyperSYS AI</span>
              </div>
              <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors lg:block hidden">
                <ChevronLeft className="w-5 h-5 text-sidebar-foreground/70" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <Button onClick={onNewConversation} className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 justify-start gap-3 py-5">
              <Plus className="w-5 h-5" /> New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
            <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-2">History</p>
            <div className="space-y-1">
              <AnimatePresence>
                {conversations.map((conv) => (
                  <motion.div key={conv.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onMouseEnter={() => setHoveredId(conv.id)} onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                      ${activeConversationId === conv.id ? 'bg-sidebar-accent text-sidebar-foreground border-l-2 border-primary' : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground'}`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-sidebar-foreground/40">{format(new Date(conv.updated_at), 'MMM d, h:mm a')}</p>
                    </div>
                    {hoveredId === conv.id && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                        className="absolute right-2 p-1.5 rounded-md hover:bg-destructive/20 text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {conversations.length === 0 && <p className="text-sm text-sidebar-foreground/40 text-center py-8">No conversations yet</p>}
            </div>
          </div>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/30">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{user?.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.email}</p>
              </div>
              <button onClick={() => signOut()} className="p-2 rounded-lg hover:bg-destructive/20 text-sidebar-foreground/60 hover:text-destructive transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
