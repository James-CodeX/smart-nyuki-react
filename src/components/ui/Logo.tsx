import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  width = 180, 
  height = 50 
}) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? "#FFFFFF" : "#000000";
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" className={className} width={width} height={height}>
      <circle cx="50" cy="50" r="45" fill="#FFCE21"/>
      <g transform="translate(15, 15)">
        {/* Simple bee icon */}
        <ellipse cx="35" cy="35" rx="25" ry="20" fill="#FFC700" />
        <path d="M35,15 L35,55 M25,25 L45,25 M25,45 L45,45" stroke="#000" strokeWidth="4" />
        <path d="M15,30 Q5,35 15,40 M55,30 Q65,35 55,40" stroke="#000" fill="none" strokeWidth="2" />
        <circle cx="30" cy="35" r="3" fill="#000" />
        <circle cx="40" cy="35" r="3" fill="#000" />
      </g>
      <text x="105" y="45" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="30" fill={textColor}>Smart</text>
      <text x="105" y="75" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="30" fill={textColor}>Nyuki</text>
    </svg>
  );
};

export const BeeIcon: React.FC<LogoProps> = ({ 
  className = "", 
  width = 40, 
  height = 40 
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" className={className} width={width} height={height}>
      <circle cx="35" cy="35" r="32" fill="#FFCE21"/>
      <g transform="translate(10, 10)">
        <ellipse cx="25" cy="25" rx="18" ry="15" fill="#FFC700" />
        <path d="M25,10 L25,40 M18,18 L32,18 M18,32 L32,32" stroke="#000" strokeWidth="3" />
        <path d="M10,22 Q5,25 10,28 M40,22 Q45,25 40,28" stroke="#000" fill="none" strokeWidth="1.5" />
        <circle cx="22" cy="25" r="2" fill="#000" />
        <circle cx="28" cy="25" r="2" fill="#000" />
      </g>
    </svg>
  );
};

export default Logo;
