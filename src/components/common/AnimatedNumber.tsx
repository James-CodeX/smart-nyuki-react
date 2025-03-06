
import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 1,
  duration = 1.5,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    let start = 0;
    const end = value;
    
    // If value is large, start from a more reasonable number
    if (end > 100) {
      start = end * 0.5;
    }
    
    // Animate from start to end
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const timer = setInterval(() => {
      const now = Date.now();
      if (now >= endTime) {
        setDisplayValue(end);
        clearInterval(timer);
        return;
      }
      
      const progress = (now - startTime) / (endTime - startTime);
      const currentValue = start + (end - start) * progress;
      setDisplayValue(currentValue);
    }, 16);
    
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    });
    
    return () => clearInterval(timer);
  }, [value, duration, controls]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={controls}
      className={className}
    >
      {displayValue.toFixed(decimals)}
    </motion.span>
  );
};

export default AnimatedNumber;
