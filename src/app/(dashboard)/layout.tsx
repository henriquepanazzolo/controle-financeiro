/**
 * Dashboard Layout
 * 
 * Authenticated layout with Sidebar + TopBar + month context.
 * Wraps all protected pages.
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { getMonthName, getCurrentMonthYear } from '@/utils/formatDate';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Get from URL or default to current
    const current = getCurrentMonthYear();
    const month = Number(searchParams.get('month')) || current.month;
    const year = Number(searchParams.get('year')) || current.year;

    const updateDate = useCallback((newMonth: number, newYear: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('month', String(newMonth));
        params.set('year', String(newYear));
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

    const handlePrevMonth = useCallback(() => {
        let newMonth = month - 1;
        let newYear = year;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        updateDate(newMonth, newYear);
    }, [month, year, updateDate]);

    const handleNextMonth = useCallback(() => {
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        updateDate(newMonth, newYear);
    }, [month, year, updateDate]);

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
