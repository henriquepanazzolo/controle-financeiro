/**
 * TopBar Component
 * 
 * Contains month selector, theme toggle, and user info.
 */
'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import styles from './TopBar.module.css';

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
        <header className={styles.topbar}>
            <div className={styles.monthSelector}>
                <button
                    onClick={onPrevMonth}
                    className={styles.monthBtn}
                    aria-label="Mês anterior"
                >
                    ←
                </button>
                <span className={styles.monthLabel}>{monthLabel}</span>
                <button
                    onClick={onNextMonth}
                    className={styles.monthBtn}
                    aria-label="Próximo mês"
                >
                    →
                </button>
            </div>

            <div className={styles.actions}>
                <button
                    onClick={toggleTheme}
                    className={styles.themeToggle}
                    aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className={styles.user}>
                    <div className={styles.avatar}>
                        {userName?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <span className={styles.userName}>{userName ?? 'Usuário'}</span>
                </div>
            </div>
        </header>
    );
}
