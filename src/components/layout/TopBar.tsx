/**
 * TopBar Component
 * 
 * Contains month selector, theme toggle, and user info.
 */
'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
    month: number;
    year: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    monthLabel: string;
    userName?: string;
}

export default function TopBar({
    onPrevMonth,
    onNextMonth,
    monthLabel,
    userName,
}: TopBarProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-40 h-16 w-full flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
            {/* Month Selector */}
            <div className="flex items-center gap-4">
                <Button
                    variant="glass"
                    size="icon"
                    onClick={onPrevMonth}
                    aria-label="Mês anterior"
                    className="h-9 w-9 rounded-lg"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                <span className="font-display text-lg font-semibold text-slate-200 min-w-[140px] text-center">
                    {monthLabel}
                </span>

                <Button
                    variant="glass"
                    size="icon"
                    onClick={onNextMonth}
                    aria-label="Próximo mês"
                    className="h-9 w-9 rounded-lg"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <Button
                    variant="glass"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Alternar tema"
                    className="h-10 w-10 rounded-full"
                >
                    {theme === 'light' ? (
                        <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                        <Sun className="w-5 h-5 text-amber-400" />
                    )}
                </Button>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-800/50">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                        {userName?.charAt(0).toUpperCase() ?? <User className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium text-slate-300 hidden md:inline-block">
                        {userName ?? 'Usuário'}
                    </span>
                </div>
            </div>
        </header>
    );
}
