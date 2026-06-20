import { Routes, Route, useLocation } from 'react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, GraduationCap, ArrowUp } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Lectures } from '@/pages/Lectures';
import { Projects } from '@/pages/Projects';
import { Analytics } from '@/pages/Analytics';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Animated route wrapper                                            */
/* ------------------------------------------------------------------ */

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Back-to-top button                                                */
/* ------------------------------------------------------------------ */

function BackToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      setVisible(el.scrollTop > 400);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <button
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="back-to-top fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-colors cursor-pointer"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  /* Scroll-to-top on route change */
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  /* Header glow on scroll */
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const onScroll = () => {
      setHeaderScrolled(el.scrollTop > 20);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background flex-col">
      <header
        className={`flex h-16 shrink-0 items-center gap-4 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md lg:px-6 z-10 transition-all duration-300 ${
          headerScrolled ? 'header-scrolled' : ''
        }`}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r border-border/50 bg-background">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
           <GraduationCap className="h-6 w-6 text-primary" />
           <span className="text-lg font-bold tracking-tight text-foreground">Web Dev Tracker</span>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/lectures" element={<AnimatedPage><Lectures /></AnimatedPage>} />
            <Route path="/projects" element={<AnimatedPage><Projects /></AnimatedPage>} />
            <Route path="/analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>

      <BackToTop scrollRef={mainRef} />
    </div>
  );
}
