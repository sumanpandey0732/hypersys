import { motion } from 'framer-motion';
import { Sparkles, Code, MessageCircle, Lightbulb, Wand2 } from 'lucide-react';

const suggestions = [
  {
    icon: Code,
    title: 'Write Code',
    prompt: 'Help me write a Python function to sort a list',
  },
  {
    icon: MessageCircle,
    title: 'Creative Writing',
    prompt: 'Write a short story about a time traveler',
  },
  {
    icon: Lightbulb,
    title: 'Explain Concepts',
    prompt: 'Explain quantum computing in simple terms',
  },
  {
    icon: Wand2,
    title: 'Problem Solving',
    prompt: 'Help me plan a weekly workout routine',
  },
];

interface WelcomeScreenProps {
  onSuggestionClick: (prompt: string) => void;
}

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-4 pb-20"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse-glow"
      >
        <Sparkles className="w-10 h-10 text-primary" />
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-display font-bold text-center mb-3">
        Hello! I'm <span className="gradient-text">Hypermid AI</span>
      </h1>
      <p className="text-muted-foreground text-center max-w-md mb-10">
        Your intelligent assistant for conversations, coding, writing, and more.
        How can I help you today?
      </p>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {suggestions.map((item, index) => (
          <motion.button
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            onClick={() => onSuggestionClick(item.prompt)}
            className="group flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all duration-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground/90">{item.title}</p>
              <p className="text-sm text-muted-foreground truncate">{item.prompt}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
