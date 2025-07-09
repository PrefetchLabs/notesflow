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
  Edit3,
  Minimize,
  PenTool,
  ChevronRight
} from 'lucide-react';

interface AIDropdownMenuProps {
  onCommand: (command: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function AIDropdownMenu({ onCommand, onClose, anchorRef }: AIDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

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
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
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
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose, anchorRef]);

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
    { 
      id: 'edit-selection', 
      label: 'Edit selection...', 
      icon: Edit3,
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
        <input
          type="text"
          placeholder="Ask AI anything..."
          className="w-full bg-[#3a3a3a] text-white placeholder-gray-400 px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-purple-500"
          onClick={(e) => e.stopPropagation()}
        />
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
              onClick={() => {
                if (!item.hasSubmenu) {
                  onCommand(item.id);
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

  // Use portal to render outside of the formatting toolbar
  if (typeof window !== 'undefined') {
    return createPortal(menuContent, document.body);
  }

  return null;
}