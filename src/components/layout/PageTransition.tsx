import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  animate?: boolean;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
};

const noAnimationVariants = {
  initial: {
    opacity: 1,
    y: 0,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 1,
    y: 0,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const noAnimationTransition = {
  duration: 0,
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, animate = false }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={animate ? pageVariants : noAnimationVariants}
      transition={animate ? pageTransition : noAnimationTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
