import { motion } from 'framer-motion';
import { Sparkles, Code, Lightbulb, Globe, Zap, Brain, Search } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: "Write code",
    prompt: "Help me write a Python function to sort a list of dictionaries by a specific key",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-cyan-400"
  },
  {
    icon: Lightbulb,
    title: "Explain concepts",
    prompt: "Explain quantum computing in simple terms with examples",
    gradient: "from-yellow-500/20 to-orange-500/20",
    iconColor: "text-yellow-400"
  },
  {
    icon: Search,
    title: "Search the web",
    prompt: "What are the latest news about artificial intelligence?",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400"
  },
  {
    icon: Brain,
    title: "Creative ideas",
    prompt: "Give me 5 innovative startup ideas for 2025",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
  }
} as const;

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
      <motion.div 
        className="max-w-3xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div 
          variants={itemVariants}
          className="mb-12"
        >
          <motion.div 
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 glow-effect relative"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="w-12 h-12 text-primary" />
            <motion.div
              className="absolute inset-0 rounded-3xl bg-primary/10"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-5xl font-display font-bold mb-4"
            variants={itemVariants}
          >
            <span className="gradient-text">Hypermid AI</span>
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Your intelligent assistant for coding, learning, searching, and creating. 
            <span className="text-primary"> Ask me anything!</span>
          </motion.p>
        </motion.div>

        {/* Feature badges */}
        <motion.div 
          className="flex flex-wrap justify-center gap-3 mb-10"
          variants={itemVariants}
        >
          {[
            { icon: Zap, label: "Lightning Fast", color: "text-yellow-400" },
            { icon: Globe, label: "Real-time Search", color: "text-green-400" },
            { icon: Brain, label: "Smart & Helpful", color: "text-purple-400" },
          ].map((badge, index) => (
            <motion.div
              key={badge.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <badge.icon className={`w-4 h-4 ${badge.color}`} />
              <span className="text-sm text-muted-foreground">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Suggestion Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={containerVariants}
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              variants={itemVariants}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className={`group relative p-5 rounded-2xl bg-gradient-to-br ${suggestion.gradient} border border-border/30 hover:border-primary/30 transition-all duration-300 text-left overflow-hidden`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              
              <div className="relative z-10 flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-secondary/50 ${suggestion.iconColor}`}>
                  <suggestion.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {suggestion.prompt}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Hint text */}
        <motion.p
          className="mt-8 text-muted-foreground/60 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          💡 Tip: Ask about real-time data like news, weather, or stock prices!
        </motion.p>
      </motion.div>
    </div>
  );
}
