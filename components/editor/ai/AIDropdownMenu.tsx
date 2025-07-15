'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles,
  Check,
  Languages,
  Maximize,
  FileText,
  Lightbulb,
  Minimize,
  PenTool,
  ChevronRight
} from 'lucide-react';

interface AIDropdownMenuProps {
  onCommand: (command: string, value?: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function AIDropdownMenu({ onCommand, onClose, anchorRef }: AIDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        submenuRef.current &&
        !submenuRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose, anchorRef]);

  const [inputValue, setInputValue] = useState('');
  
  const languageOptions = [
    { id: 'translate-korean', label: '한국어 (Korean)', flag: '🇰🇷' },
    { id: 'translate-english', label: 'English', flag: '🇺🇸' },
    { id: 'translate-chinese', label: '中文 (Chinese)', flag: '🇨🇳' },
    { id: 'translate-japanese', label: '日本語 (Japanese)', flag: '🇯🇵' },
  ];

  const toneOptions = [
    { id: 'change-tone-professional', label: 'Professional', icon: '💼' },
    { id: 'change-tone-casual', label: 'Casual', icon: '😊' },
    { id: 'change-tone-friendly', label: 'Friendly', icon: '🤝' },
    { id: 'change-tone-persuasive', label: 'Persuasive', icon: '💡' },
    { id: 'change-tone-academic', label: 'Academic', icon: '🎓' },
    { id: 'change-tone-creative', label: 'Creative', icon: '🎨' },
  ];

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onCommand('custom-prompt', inputValue.trim());
      setInputValue('');
    }
  };

  const handleMenuItemClick = (item: any, event: React.MouseEvent<HTMLButtonElement>) => {
    if (item.hasSubmenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 4
      });
      setActiveSubmenu(item.id);
    } else {
      onCommand(item.id);
    }
  };

  const menuItems = [
    { 
      id: 'suggested',
      label: 'Suggested',
      type: 'header'
    },
    { 
      id: 'improve', 
      label: 'Improve writing', 
      icon: Sparkles,
      color: 'text-purple-500'
    },
    { 
      id: 'fix-grammar', 
      label: 'Fix spelling & grammar', 
      icon: Check,
      color: 'text-green-500'
    },
    { 
      id: 'translate', 
      label: 'Translate to', 
      icon: Languages,
      hasSubmenu: true,
      color: 'text-blue-500'
    },
    { 
      id: 'divider1',
      type: 'divider'
    },
    { 
      id: 'edit',
      label: 'Edit',
      type: 'header'
    },
    { 
      id: 'shorten', 
      label: 'Make shorter', 
      icon: Minimize,
      color: 'text-purple-500'
    },
    { 
      id: 'change-tone', 
      label: 'Change tone', 
      icon: PenTool,
      hasSubmenu: true,
      color: 'text-purple-500'
    },
    { 
      id: 'simplify', 
      label: 'Simplify language', 
      icon: Lightbulb,
      color: 'text-purple-500'
    },
    { 
      id: 'extend', 
      label: 'Make longer', 
      icon: Maximize,
      color: 'text-purple-500'
    },
  ];

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-[100] w-64 bg-[#2a2a2a] text-white rounded-lg shadow-2xl py-1 overflow-hidden"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        top: position.top,
        left: position.left,
      }}
    >
      <div className="px-3 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Ask AI anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-[#3a3a3a] text-white placeholder-gray-400 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-purple-500"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.type === 'header') {
            return (
              <div key={item.id} className="px-3 py-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                {item.label}
              </div>
            );
          }
          
          if (item.type === 'divider') {
            return <div key={item.id} className="my-1 border-t border-gray-700" />;
          }

          return (
            <button
              key={item.id}
              onClick={(e) => handleMenuItemClick(item, e)}
              onMouseEnter={(e) => {
                if (item.hasSubmenu) {
                  handleMenuItemClick(item, e);
                }
              }}
              onMouseLeave={() => {
                if (!item.hasSubmenu) {
                  setActiveSubmenu(null);
                }
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-[#3a3a3a] flex items-center gap-3 group"
            >
              {item.icon && (
                <item.icon className={`h-4 w-4 ${item.color || 'text-gray-400'}`} />
              )}
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && (
                <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const submenuContent = (activeSubmenu === 'translate' || activeSubmenu === 'change-tone') && (
    <div
      ref={submenuRef}
      className="fixed z-[101] w-48 bg-[#2a2a2a] text-white rounded-lg shadow-2xl py-1 overflow-hidden"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        top: submenuPosition.top,
        left: submenuPosition.left,
      }}
      onMouseLeave={() => setActiveSubmenu(null)}
    >
      {activeSubmenu === 'translate' && languageOptions.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onCommand(lang.id)}
          className="w-full px-3 py-2 text-sm text-left hover:bg-[#3a3a3a] flex items-center gap-3"
        >
          <span className="text-lg">{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
      {activeSubmenu === 'change-tone' && toneOptions.map((tone) => (
        <button
          key={tone.id}
          onClick={() => onCommand(tone.id)}
          className="w-full px-3 py-2 text-sm text-left hover:bg-[#3a3a3a] flex items-center gap-3"
        >
          <span className="text-lg">{tone.icon}</span>
          <span>{tone.label}</span>
        </button>
      ))}
    </div>
  );

  // Use portal to render outside of the formatting toolbar
  if (typeof window !== 'undefined') {
    return (
      <>
        {createPortal(menuContent, document.body)}
        {activeSubmenu && createPortal(submenuContent, document.body)}
      </>
    );
  }

  return null;
}