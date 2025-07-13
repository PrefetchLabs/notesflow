/**
 * Utility functions for handling paste operations in BlockNote editor
 */

import { Block } from "@blocknote/core";

/**
 * Preprocesses HTML content to handle separators
 * @param html - The raw HTML string from clipboard
 * @returns Processed HTML string with separator markers
 */
export function preprocessPastedHTML(html: string): string {
  // Create a temporary container to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Process horizontal rules - convert to a special div that BlockNote will recognize
  const hrs = doc.querySelectorAll('hr');
  hrs.forEach((hr) => {
    // Create a div that will be parsed as a paragraph with special styling
    const separator = doc.createElement('div');
    separator.setAttribute('data-separator', 'true');
    separator.style.height = '1px';
    separator.style.backgroundColor = '#e5e7eb';
    separator.style.margin = '24px 0';
    separator.innerHTML = '&nbsp;'; // Non-breaking space to ensure it's not empty
    hr.parentNode?.replaceChild(separator, hr);
  });
  
  // Process code blocks to preserve language information
  const codeBlocks = doc.querySelectorAll('pre code');
  codeBlocks.forEach((code) => {
    const pre = code.parentElement;
    if (pre) {
      // Extract language from class (e.g., "language-javascript")
      const languageClass = Array.from(code.classList).find(cls => cls.startsWith('language-'));
      const language = languageClass ? languageClass.replace('language-', '') : '';
      
      // Add language as data attribute
      if (language) {
        pre.setAttribute('data-language', language);
      }
    }
  });
  
  // Return the processed HTML
  return doc.body.innerHTML;
}

/**
 * Checks if the clipboard data contains HTML content
 * @param clipboardData - The clipboard data from paste event
 * @returns true if HTML content is present
 */
export function hasHTMLContent(clipboardData: DataTransfer | null): boolean {
  if (!clipboardData) return false;
  return clipboardData.types.includes('text/html');
}

/**
 * Extracts and processes HTML content from clipboard
 * @param clipboardData - The clipboard data from paste event
 * @returns Processed HTML string or null
 */
export function getProcessedHTMLFromClipboard(clipboardData: DataTransfer | null): string | null {
  if (!hasHTMLContent(clipboardData)) return null;
  
  const rawHTML = clipboardData?.getData('text/html');
  if (!rawHTML) return null;
  
  return preprocessPastedHTML(rawHTML);
}

/**
 * Enhances blocks with proper formatting for better visual appearance
 * @param blocks - Array of BlockNote blocks
 * @returns Enhanced blocks with improved formatting
 */
export function enhanceBlocksFormatting(blocks: Block[]): Block[] {
  return blocks.map(block => {
    // Handle separator blocks
    if (block.type === 'paragraph' && block.content) {
      // Check if this is a separator (single non-breaking space or similar)
      const textContent = getTextFromContent(block.content);
      if (textContent.trim() === '' || textContent === '\u00A0') {
        // For separator blocks, we'll use a specific styling approach
        // Since we preprocessed the HTML to mark separators, we can identify them here
        if (textContent === '\u00A0' || textContent === ' ') {
          // Create a visual separator using a custom data attribute
          return {
            ...block,
            content: [{
              type: 'text',
              text: ' ', // Single space
              styles: {}
            }],
            props: {
              ...block.props,
              // Use a custom data attribute instead of backgroundColor
              // This will be styled via CSS to be almost invisible
              backgroundColor: 'gray', // Gray background for separator styling
              textAlignment: 'center'
            }
          };
        }
      }
    }
    
    // Handle code blocks - ensure they have proper language set
    if (block.type === 'codeBlock' && block.props) {
      // If no language is set, try to detect from content
      if (!block.props.language && block.content) {
        const detectedLang = detectLanguageFromContent(getTextFromContent(block.content));
        if (detectedLang) {
          return {
            ...block,
            props: {
              ...block.props,
              language: detectedLang
            }
          };
        }
      }
    }
    
    // Recursively process children
    if (block.children && block.children.length > 0) {
      return {
        ...block,
        children: enhanceBlocksFormatting(block.children)
      };
    }
    
    return block;
  });
}

/**
 * Helper function to extract text from block content
 */
function getTextFromContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') return item;
      if (item.text) return item.text;
      return '';
    }).join('');
  }
  return '';
}

/**
 * Simple language detection based on content patterns
 */
function detectLanguageFromContent(content: string): string | null {
  const patterns = {
    javascript: /(?:const|let|var|function|=>|console\.log)/,
    typescript: /(?:interface|type|enum|implements|private|public)/,
    python: /(?:def|import|from|print|if __name__|class)/,
    html: /(?:<[a-z]+.*?>|<\/[a-z]+>)/i,
    css: /(?:\{[\s\S]*?[a-z-]+\s*:\s*[^;}]+)/,
    json: /^\s*\{[\s\S]*\}\s*$/,
    markdown: /(?:^#{1,6}\s|^\*\s|^\d+\.\s|\[.*?\]\(.*?\))/m,
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      return lang;
    }
  }
  
  return null;
}