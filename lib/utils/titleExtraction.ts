/**
 * Extracts a title from BlockNote content
 * - Extracts from first line of content (max 50 chars)
 * - If first line is empty or too short, uses first non-empty line
 * - Falls back to 'Untitled Note' if no suitable content
 */

interface BlockNoteBlock {
  type: string;
  content?: Array<{
    type: string;
    text?: string;
    styles?: Record<string, any>;
  }>;
  props?: Record<string, any>;
  children?: BlockNoteBlock[];
}

export function extractTitleFromContent(content: BlockNoteBlock[] | null | undefined): string {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return 'Untitled Note';
  }

  // Iterate through blocks to find first non-empty text
  for (const block of content) {
    const text = extractTextFromBlock(block);
    if (text && text.trim().length > 0) {
      // Truncate to 50 characters and clean up
      const title = text.trim().substring(0, 50);
      // If truncated, add ellipsis
      return text.trim().length > 50 ? `${title}...` : title;
    }
  }

  return 'Untitled Note';
}

/**
 * Recursively extracts text content from a block
 */
function extractTextFromBlock(block: BlockNoteBlock): string {
  let text = '';

  // Extract text from content array
  if (block.content && Array.isArray(block.content)) {
    for (const item of block.content) {
      if (item.type === 'text' && item.text) {
        text += item.text;
      }
    }
  }

  // If no text found and block has children, check first child
  if (!text && block.children && block.children.length > 0) {
    text = extractTextFromBlock(block.children[0]);
  }

  return text;
}

/**
 * Checks if a title has meaningful content (not just "Untitled Note" variants)
 */
export function isMeaningfulTitle(title: string): boolean {
  const normalizedTitle = title.toLowerCase().trim();
  const unmeaningfulTitles = [
    'untitled note',
    'untitled',
    'new note',
    'note',
    ''
  ];
  
  return !unmeaningfulTitles.includes(normalizedTitle);
}

/**
 * Generates a title suggestion based on content
 * Returns null if the current title is already meaningful
 */
export function suggestTitleFromContent(
  currentTitle: string,
  content: BlockNoteBlock[] | null | undefined
): string | null {
  // If current title is meaningful, don't suggest a new one
  if (isMeaningfulTitle(currentTitle)) {
    return null;
  }

  // Extract title from content
  const suggestedTitle = extractTitleFromContent(content);
  
  // Only suggest if it's different from current and meaningful
  if (suggestedTitle !== currentTitle && isMeaningfulTitle(suggestedTitle)) {
    return suggestedTitle;
  }

  return null;
}