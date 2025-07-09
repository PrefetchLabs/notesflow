import { describe, it, expect } from 'vitest';
import { extractTitleFromContent, isMeaningfulTitle, suggestTitleFromContent } from '../titleExtraction';

describe('titleExtraction', () => {
  describe('extractTitleFromContent', () => {
    it('should return "Untitled Note" for null or undefined content', () => {
      expect(extractTitleFromContent(null)).toBe('Untitled Note');
      expect(extractTitleFromContent(undefined)).toBe('Untitled Note');
    });

    it('should return "Untitled Note" for empty array', () => {
      expect(extractTitleFromContent([])).toBe('Untitled Note');
    });

    it('should extract text from first paragraph block', () => {
      const content = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is my first note' }
          ]
        }
      ];
      expect(extractTitleFromContent(content)).toBe('This is my first note');
    });

    it('should truncate long titles to 50 characters', () => {
      const content = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a very long title that exceeds the fifty character limit and should be truncated' }
          ]
        }
      ];
      expect(extractTitleFromContent(content)).toBe('This is a very long title that exceeds the fifty c...');
    });

    it('should skip empty blocks and use first non-empty one', () => {
      const content = [
        {
          type: 'paragraph',
          content: []
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Second paragraph with content' }
          ]
        }
      ];
      expect(extractTitleFromContent(content)).toBe('Second paragraph with content');
    });

    it('should handle nested blocks', () => {
      const content = [
        {
          type: 'bulletListItem',
          children: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Nested bullet point' }
              ]
            }
          ]
        }
      ];
      expect(extractTitleFromContent(content)).toBe('Nested bullet point');
    });
  });

  describe('isMeaningfulTitle', () => {
    it('should return false for generic titles', () => {
      expect(isMeaningfulTitle('Untitled Note')).toBe(false);
      expect(isMeaningfulTitle('untitled')).toBe(false);
      expect(isMeaningfulTitle('New Note')).toBe(false);
      expect(isMeaningfulTitle('note')).toBe(false);
      expect(isMeaningfulTitle('')).toBe(false);
    });

    it('should return true for meaningful titles', () => {
      expect(isMeaningfulTitle('My Project Ideas')).toBe(true);
      expect(isMeaningfulTitle('Meeting Notes - Jan 2024')).toBe(true);
      expect(isMeaningfulTitle('Task List')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isMeaningfulTitle('UNTITLED NOTE')).toBe(false);
      expect(isMeaningfulTitle('UnTiTlEd')).toBe(false);
    });
  });

  describe('suggestTitleFromContent', () => {
    const sampleContent = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Project Planning Meeting' }
        ]
      }
    ];

    it('should return null if current title is already meaningful', () => {
      expect(suggestTitleFromContent('My Custom Title', sampleContent)).toBe(null);
    });

    it('should suggest title from content if current title is generic', () => {
      expect(suggestTitleFromContent('Untitled Note', sampleContent)).toBe('Project Planning Meeting');
    });

    it('should return null if extracted title is not meaningful', () => {
      const emptyContent = [
        {
          type: 'paragraph',
          content: []
        }
      ];
      expect(suggestTitleFromContent('Untitled Note', emptyContent)).toBe(null);
    });

    it('should return null if extracted title is same as current', () => {
      expect(suggestTitleFromContent('Project Planning Meeting', sampleContent)).toBe(null);
    });
  });
});