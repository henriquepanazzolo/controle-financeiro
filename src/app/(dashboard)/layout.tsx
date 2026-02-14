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
        <div className="flex min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                <TopBar
                    month={month}
                    year={year}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    monthLabel={monthLabel}
                />
                <main className="flex-1 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
