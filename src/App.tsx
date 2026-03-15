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
  ArrowRight
} from 'lucide-react';

// --- Types ---
interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  featured?: boolean;
}

// --- Mock Data ---
const PROJECTS: Project[] = [
  { id: 1, title: "Lumina Watch Series", category: "Product Design", image: "https://picsum.photos/seed/watch3d/1080/1080", featured: true },
  { id: 2, title: "Aetheria Architecture", category: "Environment", image: "https://picsum.photos/seed/arch3d/1080/1080" },
  { id: 3, title: "Cybernetic Core", category: "Sci-Fi Concept", image: "https://picsum.photos/seed/cyber3d/1080/1080" },
  { id: 4, title: "Organic Flow", category: "Abstract Art", image: "https://picsum.photos/seed/abstract3d/1080/1080" },
  { id: 5, title: "Velocity Supercar", category: "Automotive", image: "https://picsum.photos/seed/car3d/1080/1080" },
  { id: 6, title: "Nebula Fragrance", category: "Product Design", image: "https://picsum.photos/seed/perfume3d/1080/1080" },
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

// --- Components ---

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
}> = ({ children, className, href, variant = 'default' }) => {
  const { x, y, handleMouseMove, handleMouseLeave } = useMagnetic();

  const isPrimary = variant === 'primary';

  return (
    <motion.a
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className={`relative inline-flex items-center justify-center overflow-hidden group ${className}`}
    >
      <span className={`relative z-10 transition-colors duration-500 ${isPrimary ? 'group-hover:text-bg' : 'group-hover:text-bg'}`}>
        {children}
      </span>
      
      {/* Liquid Fill Background */}
      <motion.div 
        className={`absolute inset-0 ${isPrimary ? 'bg-white' : 'bg-white/10'} -z-0`}
        initial={{ y: "100%" }}
        whileHover={{ y: "0%" }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      />
      
      {/* Wave Effect during fill */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-[200%] bg-white/20 -z-0"
        initial={{ y: "100%", skewY: 0 }}
        whileHover={{ 
          y: ["100%", "-100%"],
          skewY: [-10, 10, -10]
        }}
        transition={{ 
          y: { duration: 1.5, ease: "linear", repeat: Infinity },
          skewY: { duration: 2, ease: "easeInOut", repeat: Infinity }
        }}
      />

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

const Portfolio = () => (
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
        {PROJECTS.map((project, idx) => (
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

const Contact = () => (
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
        
        <motion.div 
          className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-16 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center group cursor-pointer">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3 group-hover:text-white transition-colors">Email</p>
            <p className="text-xl text-white font-light border-b border-transparent group-hover:border-white transition-all">hello@modelverse.art</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Availability</p>
            <p className="text-xl text-white font-light">Open for Freelance Projects</p>
          </div>
        </motion.div>

        <MagneticButton variant="primary" className="px-20 py-8 text-[10px] uppercase tracking-[0.5em] text-white">
          Send a Message
        </MagneticButton>
      </motion.div>
    </div>
  </section>
);

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

const Footer = () => (
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

      <div className="text-[10px] uppercase tracking-[0.4em] text-white/20">
        © 2026 MODELVERSE. All Rights Reserved.
      </div>
    </motion.div>
  </footer>
);

export default function App() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const addRipple = (e: React.MouseEvent) => {
    const newRipple = { x: e.clientX, y: e.clientY, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  };

  return (
    <div 
      className="bg-bg min-h-screen selection:bg-accent/20 selection:text-white cursor-none"
      onClick={addRipple}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
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

      <CustomCursor />
      <ProgressBar />
      <Navbar />
      <Hero />
      <Portfolio />
      <About />
      <CreativeProcess />
      <Contact />
      <Footer />
    </div>
  );
}
