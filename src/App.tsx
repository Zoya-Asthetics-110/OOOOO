/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Instagram, 
  Twitter, 
  Linkedin, 
  ChevronDown, 
  Cpu, 
  Layers, 
  Zap, 
  Sun, 
  Play, 
  CheckCircle2,
  Box,
  Palette,
  Lightbulb,
  Camera,
  ArrowRight,
  LayoutDashboard,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  ExternalLink,
  LogOut,
  Settings,
  LogIn
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, auth } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  featured?: boolean;
}

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

// --- Mock Data ---
const PROJECTS: Project[] = [
  { 
    id: "1", 
    title: "Lumina Watch Series", 
    category: "Product Design", 
    description: "A high-end luxury watch concept featuring advanced materials and cinematic lighting.",
    image: "https://picsum.photos/seed/watch3d/1080/1080", 
    featured: true 
  },
  { 
    id: "2", 
    title: "Aetheria Architecture", 
    category: "Environment", 
    description: "Futuristic architectural visualization exploring the harmony between nature and technology.",
    image: "https://picsum.photos/seed/arch3d/1080/1080" 
  },
  { 
    id: "3", 
    title: "Cybernetic Core", 
    category: "Sci-Fi Concept", 
    description: "Intricate mechanical design for a futuristic energy source, rendered with PBR materials.",
    image: "https://picsum.photos/seed/cyber3d/1080/1080" 
  },
  { 
    id: "4", 
    title: "Organic Flow", 
    category: "Abstract Art", 
    description: "Procedural abstract forms exploring fluid dynamics and organic textures.",
    image: "https://picsum.photos/seed/abstract3d/1080/1080" 
  },
  { 
    id: "5", 
    title: "Velocity Supercar", 
    category: "Automotive", 
    description: "Aerodynamic supercar concept with a focus on aggressive lines and premium finishes.",
    image: "https://picsum.photos/seed/car3d/1080/1080" 
  },
  { 
    id: "6", 
    title: "Nebula Fragrance", 
    category: "Product Design", 
    description: "Luxury perfume bottle design inspired by cosmic phenomena.",
    image: "https://picsum.photos/seed/perfume3d/1080/1080" 
  },
];

const MESSAGES: Message[] = [
  { id: "1", name: "John Doe", email: "john@example.com", message: "Love your work! Would love to collaborate on a project.", date: "2026-03-15 10:30", read: false },
  { id: "2", name: "Sarah Smith", email: "sarah@design.co", message: "Your lighting techniques are incredible. Do you offer mentorship?", date: "2026-03-14 15:45", read: true },
];

const SKILLS = [
  { name: "Hard Surface Modeling", icon: <Box size={24} /> },
  { name: "PBR Texturing", icon: <Palette size={24} /> },
  { name: "Cinematic Lighting", icon: <Sun size={24} /> },
  { name: "V-Ray & Octane", icon: <Zap size={24} /> },
  { name: "Art Direction", icon: <Lightbulb size={24} /> },
  { name: "Post-Processing", icon: <Camera size={24} /> },
];

const PROCESS_STEPS = [
  { title: "Concept", icon: <Cpu size={20} />, description: "Initial ideation and reference gathering." },
  { title: "Modeling", icon: <Layers size={20} />, description: "High-fidelity geometry creation." },
  { title: "Texturing", icon: <Zap size={20} />, description: "PBR material development and UV mapping." },
  { title: "Lighting", icon: <Sun size={20} />, description: "Cinematic lighting setup for mood and depth." },
  { title: "Animation", icon: <Play size={20} />, description: "Dynamic movement and camera choreography." },
  { title: "Final Render", icon: <CheckCircle2 size={20} />, description: "High-resolution output and post-processing." },
];

// --- Custom Hooks ---

const useMagnetic = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    mouseX.set(clientX - centerX);
    mouseY.set(clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return { x, y, handleMouseMove, handleMouseLeave };
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('{"error":')) {
        setHasError(true);
        try {
          const parsed = JSON.parse(event.error.message);
          setErrorDetails(parsed.error);
        } catch {
          setErrorDetails(event.error.message);
        }
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="fixed inset-0 z-[500] bg-bg flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-6">
          <X size={48} className="text-red-500 mx-auto" />
          <h2 className="text-2xl font-light text-white">Something went wrong</h2>
          <p className="text-accent text-sm leading-relaxed">{errorDetails || "An unexpected error occurred while interacting with the database."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-bg rounded-xl text-[10px] uppercase tracking-widest font-bold"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const followerX = useSpring(cursorX, { damping: 20, stiffness: 250 });
  const followerY = useSpring(cursorY, { damping: 20, stiffness: 250 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, .cursor-pointer')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHover);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHover);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div 
        className="custom-cursor"
        style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div 
        className="cursor-follower"
        style={{ 
          x: followerX, 
          y: followerY, 
          translateX: '-50%', 
          translateY: '-50%',
          scale: isHovering ? 1.5 : 1,
          borderColor: isHovering ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'
        }}
      />
    </>
  );
};

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return <motion.div className="progress-bar" style={{ scaleX }} />;
};

const MagneticButton: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  href?: string;
  variant?: 'default' | 'primary';
  onClick?: () => void;
}> = ({ children, className, href, variant = 'default', onClick }) => {
  const { x, y, handleMouseMove, handleMouseLeave } = useMagnetic();

  const isPrimary = variant === 'primary';

  return (
    <motion.a
      href={href}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className={`relative inline-flex items-center justify-center overflow-hidden group cursor-pointer ${className}`}
    >
      <span className={`relative z-10 transition-colors duration-500 ${isPrimary ? 'group-hover:text-bg' : 'group-hover:text-bg'}`}>
        {children}
      </span>
      
      {/* Liquid Fill Background */}
      <motion.div 
        className={`absolute inset-0 ${isPrimary ? 'bg-white' : 'bg-white/10'} -z-0`}
        initial={{ y: "100%" }}
        whileHover={{ y: "0%" }}
        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      >
        {/* Wave SVG */}
        <svg 
          className="absolute top-0 left-0 w-[200%] h-20 -translate-y-full fill-inherit opacity-50"
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <motion.path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113,14.29,1200,52.47V0Z"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>
      
      <div className={`absolute inset-0 border ${isPrimary ? 'border-white/20' : 'border-white/10'}`} />
    </motion.a>
  );
};

const LiquidText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Background Text (Static) */}
      <span className="text-white/10">{text}</span>
      
      {/* Liquid Fill Text */}
      <motion.span
        className="absolute top-0 left-0 text-white overflow-hidden whitespace-nowrap"
        initial={{ width: "0%" }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: "easeInOut" }}
      >
        <span className="relative">
          {text}
          {/* Wave Effect */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </span>
      </motion.span>
    </div>
  );
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-bg to-transparent backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="text-xl font-bold tracking-[0.3em] text-white cursor-pointer"
    >
      MODELVERSE
    </motion.div>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.2 }}
      className="hidden md:flex space-x-12 text-[10px] uppercase tracking-[0.4em] font-medium"
    >
      {['work', 'about', 'process', 'contact'].map((item) => (
        <a key={item} href={`#${item}`} className="text-accent hover:text-white transition-colors relative group cursor-pointer">
          {item}
          <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
        </a>
      ))}
    </motion.div>
  </nav>
);

const Hero = () => {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-bg via-surface to-bg opacity-40" />
      
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <LiquidText text="MODELVERSE" className="text-6xl md:text-9xl font-light tracking-tighter mb-6" />
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="text-sm md:text-lg text-accent font-light tracking-[0.5em] uppercase mb-12"
        >
          Cinematic 3D Product Showcase
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <MagneticButton 
            href="#work"
            variant="primary"
            className="px-16 py-6 text-[10px] uppercase tracking-[0.5em] text-white"
          >
            Explore My Work
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white"
      >
        <ChevronDown size={20} />
      </motion.div>
    </section>
  );
};

const ProjectCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const floatDuration = 6 + (index % 3) * 2;
  const floatDelay = index * 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay: index * 0.15, ease: "easeOut" }}
      className={`relative aspect-square overflow-hidden bg-surface group cursor-pointer ${project.featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <motion.div
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: floatDelay
        }}
        className="w-full h-full relative"
      >
        <motion.img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-50 transition-all duration-700 group-hover:opacity-80 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Liquid Overlay on Hover */}
        <motion.div 
          className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{ skewX: -20 }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />
        
        <div className="absolute bottom-10 left-10 right-10 transform transition-transform duration-500 group-hover:translate-y-[-10px]">
          <p className="text-[10px] uppercase tracking-[0.4em] text-accent/60 mb-3">{project.category}</p>
          <h3 className={`font-light tracking-tight text-white ${project.featured ? 'text-4xl' : 'text-2xl'}`}>
            {project.title}
          </h3>
          <motion.div 
            className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center text-[10px] uppercase tracking-widest text-white"
          >
            View Project <ArrowRight size={12} className="ml-2" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Portfolio = ({ projects }: { projects: Project[] }) => (
  <section id="work" className="py-40 px-8 relative">
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="mb-24">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-xs uppercase tracking-[0.5em] text-white/40 mb-4"
        >
          Portfolio
        </motion.h2>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl font-light text-white"
        >
          Selected Works
        </motion.h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {projects.map((project, idx) => (
          <ProjectCard key={project.id} project={project} index={idx} />
        ))}
      </div>
    </div>
  </section>
);

const About = () => (
  <section id="about" className="py-40 px-8 relative overflow-hidden">
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.5 }}
      className="max-w-6xl mx-auto grid md:grid-cols-2 gap-24 items-center"
    >
      <div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-xs uppercase tracking-[0.5em] text-white/40 mb-8"
        >
          About Me
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-3xl md:text-4xl font-light leading-tight text-white mb-12"
        >
          I am Moeez, a professional 3D Artist dedicated to crafting high-end digital experiences.
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg text-accent font-light leading-relaxed mb-12 max-w-xl"
        >
          Through MODELVERSE, I transform concepts into cinematic visuals that bridge the gap between imagination and reality.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {SKILLS.map((skill, idx) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
            className="p-8 bg-surface border border-white/5 flex flex-col items-center text-center transition-colors duration-300 cursor-pointer"
          >
            <div className="text-white/30 mb-4">{skill.icon}</div>
            <span className="text-[10px] uppercase tracking-widest text-white font-medium">{skill.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
);

const CreativeProcess = () => (
  <section id="process" className="py-40 px-8 bg-surface/30 relative">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-32">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-xs uppercase tracking-[0.5em] text-white/40 mb-4"
        >
          Workflow
        </motion.h2>
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl font-light text-white"
        >
          The Creative Journey
        </motion.h3>
      </div>

      <div className="grid gap-16">
        {PROCESS_STEPS.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            className="flex items-start space-x-10 pb-16 border-b border-white/5 last:border-0 relative group cursor-pointer"
          >
            <div className="text-white/10 font-mono text-xl pt-1">0{idx + 1}</div>
            <motion.div 
              className="p-4 bg-white/5 rounded-full text-white relative z-10 overflow-hidden"
              whileHover={{ scale: 1.2 }}
            >
              {step.icon}
              <motion.div 
                className="absolute inset-0 bg-white/10 -z-10"
                initial={{ y: "100%" }}
                whileHover={{ y: "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
            <div>
              <h4 className="text-xl font-medium text-white mb-3 tracking-wide group-hover:text-accent transition-colors duration-300">{step.title}</h4>
              <p className="text-accent max-w-md leading-relaxed font-light">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Contact = ({ onSendMessage }: { onSendMessage: (m: Omit<Message, 'id' | 'date' | 'read'>) => void }) => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(async () => {
      await onSendMessage(form);
      setIsSubmitting(false);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <section id="contact" className="py-40 px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
        >
          <h2 className="text-xs uppercase tracking-[0.5em] text-white/40 mb-10">Contact</h2>
          <h3 className="text-5xl md:text-7xl font-light text-white mb-16 tracking-tighter leading-tight">
            Let's Create Something Amazing
          </h3>
          
          <div className="grid md:grid-cols-2 gap-12 text-left mb-20">
            <div className="space-y-8">
              <div className="group cursor-pointer">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3 group-hover:text-white transition-colors">Email</p>
                <p className="text-xl text-white font-light border-b border-transparent group-hover:border-white transition-all">hello@modelverse.art</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Availability</p>
                <p className="text-xl text-white font-light">Open for Freelance Projects</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                type="text" 
                placeholder="Name" 
                required
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-surface border border-white/5 rounded-none px-6 py-4 text-white focus:outline-none focus:border-white/20 transition-colors"
              />
              <input 
                type="email" 
                placeholder="Email" 
                required
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-surface border border-white/5 rounded-none px-6 py-4 text-white focus:outline-none focus:border-white/20 transition-colors"
              />
              <textarea 
                placeholder="Message" 
                rows={4}
                required
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="w-full bg-surface border border-white/5 rounded-none px-6 py-4 text-white focus:outline-none focus:border-white/20 transition-colors resize-none"
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full relative group overflow-hidden px-8 py-5 border border-white/10 text-[10px] uppercase tracking-[0.5em] text-white hover:text-bg transition-colors duration-500"
              >
                <span className="relative z-10">{isSubmitting ? 'Sending...' : submitted ? 'Message Sent' : 'Send Message'}</span>
                <motion.div 
                  className="absolute inset-0 bg-white -z-0"
                  initial={{ y: "100%" }}
                  whileHover={{ y: "0%" }}
                  transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const MagneticIcon: React.FC<{ Icon: any; href: string }> = ({ Icon, href }) => {
  const { x, y, handleMouseMove, handleMouseLeave } = useMagnetic();
  return (
    <motion.a
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className="text-white/30 hover:text-white transition-colors cursor-pointer p-2"
    >
      <Icon size={18} />
    </motion.a>
  );
};

const Footer = ({ onAdminClick }: { onAdminClick: () => void }) => (
  <footer className="py-24 px-8 border-t border-white/5 bg-bg">
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-10 md:space-y-0"
    >
      <div className="text-center md:text-left">
        <div className="text-2xl font-bold tracking-[0.3em] text-white mb-3">MODELVERSE</div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">Cinematic 3D Product Showcase</p>
      </div>
      
      <div className="flex space-x-6">
        {[Instagram, Twitter, Linkedin, Mail].map((Icon, idx) => (
          <MagneticIcon key={idx} Icon={Icon} href="#" />
        ))}
      </div>

      <div className="flex flex-col items-center md:items-end space-y-2">
        <div className="text-[10px] uppercase tracking-[0.4em] text-white/20">
          © 2026 MODELVERSE. All Rights Reserved.
        </div>
        <button 
          onClick={onAdminClick}
          className="text-[10px] uppercase tracking-[0.4em] text-white/10 hover:text-white/40 transition-colors"
        >
          Admin Portal
        </button>
      </div>
    </motion.div>
  </footer>
);

// --- Admin Components ---

const AdminLogin = ({ onLogin, user }: { onLogin: (pass: string) => void, user: User | null }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'moeezimran786') {
      setShowGoogle(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin('moeezimran786');
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface border border-white/5 p-12 rounded-3xl shadow-2xl text-center"
      >
        <div className="text-2xl font-bold tracking-[0.3em] text-white mb-8">MV ADMIN</div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-12">Authorized Personnel Only</p>
        
        {!showGoogle ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <input 
                type="password" 
                placeholder="Enter Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={cn(
                  "w-full bg-bg border rounded-xl px-6 py-4 text-white text-center focus:outline-none transition-all",
                  error ? "border-red-500" : "border-white/10 focus:border-white/40"
                )}
              />
              {error && <p className="absolute -bottom-6 left-0 w-full text-[10px] text-red-500 uppercase tracking-widest">Incorrect Password</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-white text-bg py-5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] transition-transform"
            >
              Access Portal
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            <p className="text-xs text-white/60 mb-8">Password verified. Please sign in with your admin Google account to continue.</p>
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white text-bg py-5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] transition-transform flex items-center justify-center space-x-3"
            >
              <LogIn size={16} />
              <span>Sign in with Google</span>
            </button>
            <button 
              onClick={() => setShowGoogle(false)}
              className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
            >
              Back to Password
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AdminPanel = ({ 
  projects, 
  messages,
  onClose,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onToggleMessageRead,
  user
}: { 
  projects: Project[], 
  messages: Message[],
  onClose: () => void,
  onAddProject: (p: Omit<Project, 'id'>) => void,
  onUpdateProject: (p: Project) => void,
  onDeleteProject: (id: string) => void,
  onToggleMessageRead: (id: string) => void,
  user: User | null
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'messages'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = {
    total: projects.length,
    featured: projects.filter(p => p.featured).length,
    unreadMessages: messages.filter(m => !m.read).length,
    recentUpdates: projects.length
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setPreviewImage(project.image);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setPreviewImage(null);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setProjectToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      showToast('Project deleted successfully', 'success');
      setIsConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-bg flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-surface flex flex-col">
        <div className="p-8 border-b border-white/5">
          <div className="text-xl font-bold tracking-[0.2em] text-white">MV ADMIN</div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all text-xs uppercase tracking-widest",
              activeTab === 'dashboard' ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={cn(
              "w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all text-xs uppercase tracking-widest",
              activeTab === 'projects' ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <Briefcase size={18} />
            <span>Projects</span>
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={cn(
              "w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all text-xs uppercase tracking-widest relative",
              activeTab === 'messages' ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <Mail size={18} />
            <span>Messages</span>
            {stats.unreadMessages > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
            )}
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all text-xs uppercase tracking-widest"
          >
            <LogOut size={18} />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-bg p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <header>
                <h1 className="text-4xl font-light mb-2">Dashboard</h1>
                <p className="text-accent text-sm tracking-widest uppercase">Overview of your portfolio</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Projects', value: stats.total, icon: Briefcase },
                  { label: 'Featured', value: stats.featured, icon: Zap },
                  { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail },
                  { label: 'Recent Updates', value: stats.recentUpdates, icon: Play },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface p-8 border border-white/5 rounded-2xl space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center">
                      <stat.icon size={20} className="text-white/20" />
                      <span className="text-3xl font-light">{stat.value}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-surface border border-white/5 rounded-2xl p-8">
                  <h2 className="text-xl font-light mb-6">Recent Projects</h2>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                        <div className="flex items-center space-x-4">
                          <img src={p.image} className="w-10 h-10 rounded object-cover border border-white/10" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-sm text-white">{p.title}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest">{p.category}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">Modified 2h ago</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-surface border border-white/5 rounded-2xl p-8">
                  <h2 className="text-xl font-light mb-6">Latest Messages</h2>
                  <div className="space-y-4">
                    {messages.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm text-white">{m.name}</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest truncate max-w-[200px]">{m.message}</p>
                        </div>
                        {!m.read && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'projects' ? (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-light mb-2">Projects</h1>
                  <p className="text-accent text-sm tracking-widest uppercase">Manage your work</p>
                </div>
                <button 
                  onClick={handleAdd}
                  className="flex items-center space-x-3 px-8 py-4 bg-white text-bg rounded-full text-[10px] uppercase tracking-widest font-bold hover:scale-105 transition-transform"
                >
                  <Plus size={16} />
                  <span>Add Project</span>
                </button>
              </header>

              <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest text-white/40 font-medium">Preview</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest text-white/40 font-medium">Title</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest text-white/40 font-medium">Category</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest text-white/40 font-medium">Status</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest text-white/40 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <img src={p.image} className="w-16 h-16 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-white font-medium">{p.title}</p>
                          <p className="text-[10px] text-white/30 truncate max-w-[200px]">{p.description}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] uppercase tracking-widest text-white/40">{p.category}</span>
                        </td>
                        <td className="px-8 py-6">
                          {p.featured ? (
                            <span className="px-3 py-1 bg-white/10 text-white text-[8px] uppercase tracking-widest rounded-full border border-white/10">Featured</span>
                          ) : (
                            <span className="text-[8px] uppercase tracking-widest text-white/20">Standard</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(p)}
                              className="p-2 text-white/40 hover:text-white transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => confirmDelete(p.id)}
                              className="p-2 text-white/40 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <header>
                <h1 className="text-4xl font-light mb-2">Messages</h1>
                <p className="text-accent text-sm tracking-widest uppercase">Real-time incoming feed</p>
              </header>

              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="bg-surface border border-white/5 rounded-2xl p-20 text-center">
                    <Mail size={40} className="text-white/10 mx-auto mb-6" />
                    <p className="text-white/30 uppercase tracking-widest text-xs">No messages yet</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={cn(
                        "bg-surface border border-white/5 rounded-2xl p-8 transition-all hover:border-white/20",
                        !m.read && "border-l-4 border-l-white"
                      )}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-light text-white mb-1">{m.name}</h3>
                          <p className="text-[10px] uppercase tracking-widest text-white/40">{m.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-white/20 mb-4">{m.date}</p>
                          <button 
                            onClick={() => onToggleMessageRead(m.id)}
                            className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                          >
                            {m.read ? 'Mark as Unread' : 'Mark as Read'}
                          </button>
                        </div>
                      </div>
                      <p className="text-accent font-light leading-relaxed">{m.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 right-12 z-[300] bg-white text-bg px-8 py-4 rounded-xl shadow-2xl flex items-center space-x-4 border border-white/10"
          >
            <CheckCircle2 size={20} className="text-bg" />
            <span className="text-[10px] uppercase tracking-widest font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-3xl p-12 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-light">{editingProject ? 'Edit Project' : 'New Project'}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    title: formData.get('title') as string,
                    category: formData.get('category') as string,
                    description: formData.get('description') as string,
                    image: formData.get('image') as string,
                    featured: formData.get('featured') === 'on'
                  };
                  if (editingProject) {
                    onUpdateProject({ ...editingProject, ...data });
                    showToast('Project updated successfully');
                  } else {
                    onAddProject(data);
                    showToast('Project created successfully');
                  }
                  setIsModalOpen(false);
                }}
                className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Project Title</label>
                  <input 
                    name="title"
                    defaultValue={editingProject?.title}
                    required
                    className="w-full bg-bg border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="e.g. Lumina Watch"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Category</label>
                  <input 
                    name="category"
                    defaultValue={editingProject?.category}
                    required
                    className="w-full bg-bg border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="e.g. Product Design"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Description</label>
                  <textarea 
                    name="description"
                    defaultValue={editingProject?.description}
                    required
                    rows={3}
                    className="w-full bg-bg border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-white/40 transition-colors resize-none"
                    placeholder="Describe the project..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Image URL</label>
                  <div className="flex space-x-4">
                    <input 
                      name="image"
                      defaultValue={editingProject?.image}
                      required
                      onChange={(e) => setPreviewImage(e.target.value)}
                      className="flex-1 bg-bg border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                  {previewImage && (
                    <div className="mt-4 relative group">
                      <p className="text-[8px] uppercase tracking-widest text-white/20 mb-2">Live Preview</p>
                      <img src={previewImage} className="w-full h-48 object-cover rounded-xl border border-white/10" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-bg/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] uppercase tracking-widest text-white font-bold">Image Preview</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <input 
                    type="checkbox" 
                    name="featured" 
                    id="featured"
                    defaultChecked={editingProject?.featured}
                    className="w-5 h-5 rounded border-white/10 bg-bg checked:bg-white" 
                  />
                  <label htmlFor="featured" className="text-xs uppercase tracking-widest text-white/60">Mark as Featured</label>
                </div>

                <div className="pt-8 flex space-x-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-white text-bg py-5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] transition-transform flex items-center justify-center space-x-3"
                  >
                    <Save size={16} />
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-10 border border-white/10 text-white py-5 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'portfolio' | 'admin'>('portfolio');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthenticated(u?.email === "moeezi396@gmail.com");
    });

    const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    }, (error) => {
      console.error("Projects listener error:", error);
    });

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      return;
    }

    const qMessages = query(collection(db, 'messages'), orderBy('date', 'desc'));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
    });

    return () => unsubscribeMessages();
  }, [isAuthenticated]);

  const addRipple = (e: React.MouseEvent) => {
    if (view === 'admin') return;
    const newRipple = { x: e.clientX, y: e.clientY, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  };

  const handleAddProject = async (p: Omit<Project, 'id'>) => {
    const path = 'projects';
    try {
      await addDoc(collection(db, path), {
        ...p,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleUpdateProject = async (p: Project) => {
    const { id, ...data } = p;
    const path = `projects/${id}`;
    try {
      await updateDoc(doc(db, 'projects', id), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const path = `projects/${id}`;
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleSendMessage = async (m: Omit<Message, 'id' | 'date' | 'read'>) => {
    const path = 'messages';
    try {
      await addDoc(collection(db, path), {
        ...m,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        read: false
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleToggleMessageRead = async (id: string) => {
    const path = `messages/${id}`;
    try {
      const msg = messages.find(m => m.id === id);
      if (msg) {
        await updateDoc(doc(db, 'messages', id), { read: !msg.read });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setView('portfolio');
  };

  return (
    <ErrorBoundary>
      <div 
        className={cn(
          "bg-bg min-h-screen selection:bg-accent/20 selection:text-white",
          view === 'portfolio' ? "cursor-none" : "cursor-default"
        )}
        onClick={addRipple}
      >
        <AnimatePresence>
          {view === 'portfolio' && ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                position: 'fixed',
                left: ripple.x,
                top: ripple.y,
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 9997,
                translateX: '-50%',
                translateY: '-50%'
              }}
            />
          ))}
        </AnimatePresence>

        {view === 'portfolio' ? (
          <>
            <CustomCursor />
            <ProgressBar />
            <Navbar />
            <Hero />
            <Portfolio projects={projects} />
            <About />
            <CreativeProcess />
            <Contact onSendMessage={handleSendMessage} />
            <Footer onAdminClick={() => setView('admin')} />
          </>
        ) : !isAuthenticated ? (
          <AdminLogin onLogin={() => setIsAuthenticated(true)} user={user} />
        ) : (
          <AdminPanel 
            projects={projects} 
            messages={messages}
            onClose={handleLogout}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onToggleMessageRead={handleToggleMessageRead}
            user={user}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
