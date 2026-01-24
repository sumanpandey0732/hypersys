import { motion } from 'framer-motion';
import { Sparkles, Code, Lightbulb, Globe, Zap, Brain, Search, MessageSquare, Rocket, Shield } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: "Write code",
    prompt: "Help me write a Python function to sort a list of dictionaries by a specific key",
    gradient: "from-cyan-500/15 to-blue-500/15",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-400/50"
  },
  {
    icon: Search,
    title: "Search the web",
    prompt: "What are the latest news about artificial intelligence?",
    gradient: "from-green-500/15 to-emerald-500/15",
    iconColor: "text-green-400",
    border: "border-green-500/20",
    hoverBorder: "hover:border-green-400/50"
  },
  {
    icon: Lightbulb,
    title: "Explain concepts",
    prompt: "Explain quantum computing in simple terms with examples",
    gradient: "from-yellow-500/15 to-orange-500/15",
    iconColor: "text-yellow-400",
    border: "border-yellow-500/20",
    hoverBorder: "hover:border-yellow-400/50"
  },
  {
    icon: Brain,
    title: "Creative ideas",
    prompt: "Give me 5 innovative startup ideas for 2025",
    gradient: "from-purple-500/15 to-pink-500/15",
    iconColor: "text-purple-400",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-400/50"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1]
    }
  }
} as const;

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <section 
      className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]"
      aria-label="Welcome to Hypermid AI"
    >
      <motion.div 
        className="max-w-3xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.header variants={itemVariants} className="mb-8 sm:mb-12">
          {/* Animated logo */}
          <motion.div 
            className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mb-6"
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Main icon container */}
            <motion.div 
              className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center border border-primary/30 backdrop-blur-sm"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                boxShadow: '0 0 40px hsla(172, 66%, 50%, 0.2), inset 0 0 30px hsla(172, 66%, 50%, 0.1)'
              }}
            >
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4"
            variants={itemVariants}
          >
            <span className="gradient-text">Hypermid AI</span>
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-lg mx-auto leading-relaxed px-2"
            variants={itemVariants}
          >
            Your powerful AI assistant for coding, learning, searching, and creating.
            <span className="text-primary font-medium"> Ask me anything!</span>
          </motion.p>
        </motion.header>

        {/* Feature badges */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-8 sm:mb-12 px-2"
          variants={itemVariants}
        >
          {[
            { icon: Zap, label: "Lightning Fast", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            { icon: Globe, label: "Real-time Search", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
            { icon: Shield, label: "Secure & Private", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { icon: Rocket, label: "Always Learning", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          ].map((badge, index) => (
            <motion.div
              key={badge.label}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full ${badge.bg} border ${badge.border} backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <badge.icon className={`w-4 h-4 ${badge.color}`} />
              <span className="text-xs sm:text-sm text-foreground/80 font-medium">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Suggestion Cards */}
        <motion.nav 
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2"
          variants={containerVariants}
          aria-label="Quick actions"
        >
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              variants={itemVariants}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${suggestion.gradient} border ${suggestion.border} ${suggestion.hoverBorder} transition-all duration-300 text-left overflow-hidden backdrop-blur-sm`}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`${suggestion.title}: ${suggestion.prompt}`}
            >
              {/* Shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              />
              
              <div className="relative z-10 flex items-start gap-3 sm:gap-4">
                <motion.div 
                  className={`p-3 rounded-xl bg-background/60 backdrop-blur-sm ${suggestion.iconColor} flex-shrink-0 border border-border/30`}
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  <suggestion.icon className="w-5 h-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1 group-hover:text-primary transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {suggestion.prompt}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.nav>

        {/* Hint text */}
        <motion.p
          className="mt-8 sm:mt-10 text-muted-foreground/50 text-xs sm:text-sm flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask about real-time data like news, weather, or stock prices!</span>
        </motion.p>
      </motion.div>
    </section>
  );
}
