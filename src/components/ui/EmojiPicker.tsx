'use client';

import { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
}

const EMOJI_LIST = [
    // Finance
    '💰', '💸', '💳', '🏦', '💹', '💲', '🧾', '🏧', '🪙', '💴', '💵', '💶', '💷',
    // Categories
    '🏠', '🍔', '🛒', '🚗', '💊', '🎓', '✈️', '🎮', '👗', '🐾', '💡', '💧', '📱', '🏋️', '🎁',
    // General
    '⭐', '❤️', '🔥', '⚠️', '✅', '❌', '📅', '📝', '🔒', '🔑', '💼', '📌',
    // People/Faces
    '😀', '😎', '🤔', '🙌', '👍', '👎', '👋', '👀', '👨‍👩‍👧‍👦',
    // Nature/Objects
    '🌲', '⚡', '💧', '🔥', '🍎', '☕', '🍺', '⚽', '🎵', '📷', '💻', '📞'
];

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="emoji-picker-container" ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    fontSize: '1.5rem',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    minWidth: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {value || '🏷️'}
            </button>

            {/* Popover */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 999,
                    marginTop: '0.5rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '0.25rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    minWidth: '280px',
                    width: 'max-content'
                }}>
                    {EMOJI_LIST.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                                onChange(emoji);
                                setIsOpen(false);
                            }}
                            style={{
                                fontSize: '1.25rem',
                                padding: '0.25rem',
                                border: 'none',
                                background: value === emoji ? 'var(--primary-light)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            title={emoji}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
