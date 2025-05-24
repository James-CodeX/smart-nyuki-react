/**
 * Script to replace all console.log, console.error, and console.warn statements
 * with our logger utility
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the source directory
const sourceDir = path.join(__dirname, '..', 'src');

// Make sure the logger utility exists
const loggerPath = path.join(sourceDir, 'utils', 'logger.ts');
if (!fs.existsSync(loggerPath)) {
  console.error('Logger utility not found at', loggerPath);
  process.exit(1);
}

// Find all TypeScript and JavaScript files
const getAllFiles = (dir) => {
  const files = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const files = getAllFiles(sourceDir);
console.log(`Found ${files.length} TypeScript/JavaScript files to process`);

// Process each file
let totalReplacements = 0;
let filesModified = 0;

files.forEach(filePath => {
  // Skip the logger utility itself
  if (filePath === loggerPath) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if the file already imports the logger
  const hasLoggerImport = /import\s+.*logger.*from\s+['"]@\/utils\/logger['"]/.test(content);
  
  // Replace console.log, console.error, console.warn with logger.log, logger.error, logger.warn
  let replacements = 0;
  
  // Replace console.log
  const logPattern = /console\.log\(/g;
  const logMatches = content.match(logPattern);
  if (logMatches) {
    replacements += logMatches.length;
    content = content.replace(logPattern, 'logger.log(');
  }
  
  // Replace console.error
  const errorPattern = /console\.error\(/g;
  const errorMatches = content.match(errorPattern);
  if (errorMatches) {
    replacements += errorMatches.length;
    content = content.replace(errorPattern, 'logger.error(');
  }
  
  // Replace console.warn
  const warnPattern = /console\.warn\(/g;
  const warnMatches = content.match(warnPattern);
  if (warnMatches) {
    replacements += warnMatches.length;
    content = content.replace(warnPattern, 'logger.warn(');
  }
  
  // Replace console.info
  const infoPattern = /console\.info\(/g;
  const infoMatches = content.match(infoPattern);
  if (infoMatches) {
    replacements += infoMatches.length;
    content = content.replace(infoPattern, 'logger.info(');
  }
  
  // Add logger import if needed and replacements were made
  if (replacements > 0 && !hasLoggerImport) {
    // Find the last import statement
    const importPattern = /import\s+.*from\s+['"].*['"]\s*;?\n/g;
    const importMatches = [...content.matchAll(importPattern)];
    
    if (importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const position = lastImport.index + lastImport[0].length;
      
      // Insert the logger import after the last import
      content = 
        content.substring(0, position) + 
        "import logger from '@/utils/logger';\n\n" + 
        content.substring(position);
    } else {
      // No imports found, add at the beginning of the file
      content = "import logger from '@/utils/logger';\n\n" + content;
    }
  }
  
  // Write the file if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Modified ${filePath} - ${replacements} replacements`);
    totalReplacements += replacements;
    filesModified++;
  }
});

console.log(`\nSummary:`);
console.log(`- Files modified: ${filesModified}`);
console.log(`- Total replacements: ${totalReplacements}`);
console.log(`\nDone!`); 