import { motion } from 'framer-motion';
import { Sparkles, Zap, Globe, Shield, Rocket } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1]
    }
  }
} as const;

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <section 
      className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-[calc(100dvh-12rem)]"
      aria-label="Welcome to Hypermid AI"
    >
      <motion.div 
        className="max-w-2xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.header variants={itemVariants} className="mb-8 sm:mb-10">
          {/* Stunning animated logo */}
          <motion.div 
            className="relative inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-6"
          >
            {/* Multiple glow rings */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'conic-gradient(from var(--angle), hsl(172 66% 50% / 0.3), hsl(200 80% 50% / 0.3), hsl(280 70% 50% / 0.3), hsl(172 66% 50% / 0.3))',
              }}
              animate={{
                '--angle': ['0deg', '360deg'],
                scale: [1, 1.1, 1],
              } as any}
              transition={{
                '--angle': { duration: 4, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            
            <motion.div
              className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 blur-xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Main icon container */}
            <motion.div 
              className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/50 flex items-center justify-center border border-primary/30 backdrop-blur-xl overflow-hidden"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                boxShadow: '0 0 60px hsla(172, 66%, 50%, 0.25), inset 0 0 40px hsla(172, 66%, 50%, 0.1)'
              }}
            >
              {/* Inner rotating gradient */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'conic-gradient(from var(--angle), transparent, hsl(172 66% 50% / 0.2), transparent)',
                }}
                animate={{ '--angle': ['0deg', '360deg'] } as any}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <Sparkles className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary relative z-10" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-4 sm:mb-6"
            variants={itemVariants}
          >
            <span className="gradient-text">Hypermid AI</span>
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-md mx-auto leading-relaxed px-2"
            variants={itemVariants}
          >
            Your smart, friendly assistant
          </motion.p>
        </motion.header>

        {/* Feature badges - Compact and elegant */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 px-2"
          variants={itemVariants}
        >
          {[
            { icon: Zap, label: "Lightning Fast", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            { icon: Globe, label: "Real-time Search", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
            { icon: Shield, label: "Secure & Private", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { icon: Rocket, label: "Always Learning", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
          ].map((badge, index) => (
            <motion.div
              key={badge.label}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full ${badge.bg} border ${badge.border} backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <badge.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${badge.color}`} />
              <span className="text-xs sm:text-sm text-foreground/80 font-medium">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to action - Focus on input */}
        <motion.div
          className="mt-8"
          variants={itemVariants}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            animate={{
              boxShadow: ['0 0 20px hsla(172, 66%, 50%, 0.1)', '0 0 40px hsla(172, 66%, 50%, 0.2)', '0 0 20px hsla(172, 66%, 50%, 0.1)'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm text-primary font-medium">Start typing below to begin</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
