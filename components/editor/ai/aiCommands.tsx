import { AIMenuSuggestionItem } from "@blocknote/xl-ai";
import { BlockNoteEditor } from "@blocknote/core";
import { getAIExtension } from "@/lib/editor/ai-extension";
import { 
  FileText, 
  Edit3, 
  FileCheck, 
  ListTodo,
  MessageSquare,
  Zap,
  BookOpen
} from 'lucide-react';

// Continue Writing command
export const continueWriting = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "continue_writing",
  title: "Continue Writing",
  aliases: ["continue", "keep writing", "more"],
  icon: <Edit3 size={18} />,
  onItemClick: async () => {
    try {
      console.log('[AI Command] Continue Writing - Editor:', editor);
      console.log('[AI Command] Editor extensions:', editor._tiptapEditor?.extensions);
      
      const aiExtension = getAIExtension(editor);
      console.log('[AI Command] Continue Writing - AI Extension:', aiExtension);
      
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        console.error('[AI Command] Available extensions:', editor._tiptapEditor?.extensions?.map(ext => ext.name));
        return;
      }
      
      console.log('[AI Command] Calling LLM...');
      await aiExtension.callLLM({
        userPrompt: "Continue writing from where I left off. Keep the same tone and style.",
        useSelection: false,
        defaultStreamTools: {
          add: true,
          update: false,
          delete: false,
        },
      });
    } catch (error) {
      console.error('[AI Command] Continue Writing error:', error);
    }
  },
  size: "small",
});

// Improve Clarity command
export const improveClarity = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "improve_clarity",
  title: "Improve Clarity",
  aliases: ["clarify", "clear", "simplify"],
  icon: <FileCheck size={18} />,
  onItemClick: async () => {
    try {
      const aiExtension = getAIExtension(editor);
      console.log('[AI Command] Improve Clarity - AI Extension:', aiExtension);
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        return;
      }
      await aiExtension.callLLM({
        userPrompt: "Improve the clarity of this text. Make it easier to understand while keeping the same meaning.",
        useSelection: true,
        defaultStreamTools: {
          add: false,
          update: true,
          delete: false,
        },
      });
    } catch (error) {
      console.error('[AI Command] Improve Clarity error:', error);
    }
  },
  size: "small",
});

// Summarize command
export const summarize = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "summarize",
  title: "Summarize",
  aliases: ["summary", "short", "brief"],
  icon: <FileText size={18} />,
  onItemClick: async () => {
    try {
      const aiExtension = getAIExtension(editor);
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        return;
      }
      await aiExtension.callLLM({
        userPrompt: "Summarize this content in a concise way, keeping the key points.",
        useSelection: true,
        defaultStreamTools: {
          add: true,
          update: false,
          delete: false,
        },
      });
    } catch (error) {
      console.error('[AI Command] Summarize error:', error);
    }
  },
  size: "small",
});

// Extract Tasks command
export const extractTasks = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "extract_tasks",
  title: "Extract Tasks",
  aliases: ["tasks", "todo", "action items"],
  icon: <ListTodo size={18} />,
  onItemClick: async () => {
    try {
      const aiExtension = getAIExtension(editor);
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        return;
      }
      await aiExtension.callLLM({
        userPrompt: "Extract all actionable tasks from this content and list them as bullet points with clear action verbs. Include any mentioned deadlines or priorities.",
        useSelection: true,
        defaultStreamTools: {
          add: true,
          update: false,
          delete: false,
        },
      });
    } catch (error) {
      console.error('[AI Command] Extract Tasks error:', error);
    }
  },
  size: "small",
});

// Make Informal command (example from docs)
export const makeInformal = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "make_informal",
  title: "Make Informal",
  aliases: ["informal", "casual", "friendly"],
  icon: <MessageSquare size={18} />,
  onItemClick: async () => {
    try {
      const aiExtension = getAIExtension(editor);
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        return;
      }
      await aiExtension.callLLM({
        userPrompt: "Give the selected text a more informal (casual) tone",
        useSelection: true,
        defaultStreamTools: {
          add: false,
          delete: false,
          update: true,
        },
      });
    } catch (error) {
      console.error('[AI Command] Make Informal error:', error);
    }
  },
  size: "small",
});

// Make Formal command
export const makeFormal = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "make_formal",
  title: "Make Formal",
  aliases: ["formal", "professional", "business"],
  icon: <BookOpen size={18} />,
  onItemClick: async () => {
    try {
      const aiExtension = getAIExtension(editor);
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        return;
      }
      await aiExtension.callLLM({
        userPrompt: "Make this text more formal and professional in tone",
        useSelection: true,
        defaultStreamTools: {
          add: false,
          delete: false,
          update: true,
        },
      });
    } catch (error) {
      console.error('[AI Command] Make Formal error:', error);
    }
  },
  size: "small",
});

// Quick Fix command
export const quickFix = (
  editor: BlockNoteEditor,
): AIMenuSuggestionItem => ({
  key: "quick_fix",
  title: "Quick Fix",
  aliases: ["fix", "correct", "grammar"],
  icon: <Zap size={18} />,
  onItemClick: async () => {
    try {
      const aiExtension = getAIExtension(editor);
      if (!aiExtension) {
        console.error('[AI Command] AI extension not found on editor');
        return;
      }
      await aiExtension.callLLM({
        userPrompt: "Fix any grammar, spelling, or punctuation errors in this text while keeping the original meaning and tone",
        useSelection: true,
        defaultStreamTools: {
          add: false,
          delete: false,
          update: true,
        },
      });
    } catch (error) {
      console.error('[AI Command] Quick Fix error:', error);
    }
  },
  size: "small",
});