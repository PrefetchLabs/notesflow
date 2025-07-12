#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const EXCLUDED_DIRS = ['node_modules', '.next', 'scripts', 'build', 'dist', '.git'];
const INCLUDED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

async function removeConsoleStatements(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Skip if no console statements
    if (!content.includes('console.')) {
      return false;
    }
    
    // Replace console.log, console.error, console.warn, console.debug statements
    // This regex handles multi-line console statements
    const updatedContent = content.replace(
      /console\.(log|error|warn|debug|info|trace|time|timeEnd|group|groupEnd|table|assert|count|clear|dir|dirxml|profile|profileEnd)\s*\([^)]*\)\s*;?/gm,
      '// [REMOVED_CONSOLE]'
    );
    
    // Only write if content changed
    if (content !== updatedContent) {
      await writeFile(filePath, updatedContent);
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function processDirectory(dirPath: string): Promise<number> {
  let totalCleaned = 0;
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDED_DIRS.includes(entry.name)) {
          totalCleaned += await processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        // Process included file types
        if (INCLUDED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
          const cleaned = await removeConsoleStatements(fullPath);
          if (cleaned) totalCleaned++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error);
  }
  
  return totalCleaned;
}

// Main execution
async function main() {
  console.log('🧹 Starting console statement removal...\n');
  
  const totalCleaned = await processDirectory('.');
  
  console.log(`\n✨ Done! Cleaned ${totalCleaned} files.`);
  console.log('💡 Tip: Review the changes with `git diff` before committing.');
}

main().catch(console.error);