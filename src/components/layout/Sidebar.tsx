/**
 * Sidebar Navigation Component
 * 
 * Fixed sidebar with navigation links, active state,
 * and hover effects. Dark background with Royal Blue accent.
 */
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Landmark,
    Tags,
    ClipboardList,
    Target,
    TrendingUp,
    Download,
    LogOut,
    Wallet
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transações', icon: ArrowRightLeft },
    { href: '/accounts', label: 'Contas', icon: Landmark },
    { href: '/categories', label: 'Categorias', icon: Tags },
    { href: '/budgets', label: 'Orçamentos', icon: ClipboardList },
    { href: '/goals', label: 'Metas', icon: Target },
    { href: '/reports', label: 'Relatórios', icon: TrendingUp },
    { href: '/import', label: 'Importar', icon: Download },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-50 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/50">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/50">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Wallet className="w-6 h-6 text-blue-500" />
                </div>
                <span className="font-display text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    FinancePro
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                "text-sm font-medium",
                                isActive
                                    ? "bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.1)] border border-blue-600/20"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="absolute right-0 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800/50">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                >
                    <LogOut className="w-5 h-5 transition-colors group-hover:text-red-400" />
                    <span className="text-sm font-medium">Sair</span>
                </button>
                <div className="mt-4 text-center">
                    <span className="text-xs text-slate-600">v1.0.0</span>
                </div>
            </div>
        </aside>
    );
}
