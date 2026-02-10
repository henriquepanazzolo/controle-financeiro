/**
 * Dashboard Layout
 * 
 * Authenticated layout with Sidebar + TopBar + month context.
 * Wraps all protected pages.
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { getMonthName, getCurrentMonthYear } from '@/utils/formatDate';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const initial = getCurrentMonthYear();
    const [month, setMonth] = useState(initial.month);
    const [year, setYear] = useState(initial.year);

    const handlePrevMonth = useCallback(() => {
        if (month === 1) {
            setMonth(12);
            setYear((y) => y - 1);
        } else {
            setMonth((m) => m - 1);
        }
    }, [month]);

    const handleNextMonth = useCallback(() => {
        if (month === 12) {
            setMonth(1);
            setYear((y) => y + 1);
        } else {
            setMonth((m) => m + 1);
        }
    }, [month]);

    const monthLabel = `${getMonthName(month)} ${year}`;

    return (
        <div className={styles.wrapper}>
            <Sidebar />
            <div className={styles.main}>
                <TopBar
                    month={month}
                    year={year}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    monthLabel={monthLabel}
                />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
