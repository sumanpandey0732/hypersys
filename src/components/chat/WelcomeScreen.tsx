import { motion } from 'framer-motion';
import { Sparkles, Code, MessageCircle, Lightbulb, Wand2, Zap, Brain, Rocket } from 'lucide-react';

const suggestions = [
  {
    icon: Code,
    title: 'Write Code',
    prompt: 'Help me write a Python function to sort a list efficiently with explanations',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: MessageCircle,
    title: 'Creative Writing',
    prompt: 'Write a short story about a time traveler who discovers something unexpected',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Lightbulb,
    title: 'Explain Concepts',
    prompt: 'Explain quantum computing in simple terms with real-world examples',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    icon: Wand2,
    title: 'Problem Solving',
    prompt: 'Help me create a structured weekly workout routine for beginners',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
];

const features = [
  { icon: Zap, text: 'Lightning fast responses' },
  { icon: Brain, text: 'Powered by Mistral AI' },
  { icon: Rocket, text: 'Built by Santosh Pandey' },
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
      {/* Logo with animated glow */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 w-24 h-24 bg-primary/30 rounded-3xl blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 animate-pulse-glow">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-5xl font-display font-bold text-center mb-4"
      >
        Welcome to <span className="gradient-text">Hypermid AI</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-md mb-4 text-lg"
      >
        Your intelligent assistant for conversations, coding, writing, and more.
      </motion.p>

      {/* Features badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap justify-center gap-3 mb-10"
      >
        {features.map((feature, i) => (
          <div 
            key={i}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
          >
            <feature.icon className="w-4 h-4 text-primary" />
            <span>{feature.text}</span>
          </div>
        ))}
      </motion.div>

      {/* Suggestions Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-2xl"
      >
        <p className="text-sm text-muted-foreground text-center mb-4">Try asking me:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((item, index) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestionClick(item.prompt)}
              className={`group relative flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br ${item.gradient} border border-border/50 hover:border-primary/30 transition-all duration-300 text-left overflow-hidden`}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="font-semibold text-foreground mb-1">{item.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.prompt}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
