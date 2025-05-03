import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`p-2 rounded-full ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === 'light' ? (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Moon className="h-5 w-5 text-amber-700" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Sun className="h-5 w-5 text-amber-400" />
        </motion.div>
      )}
    </motion.button>
  );
};

export default ThemeToggle;
