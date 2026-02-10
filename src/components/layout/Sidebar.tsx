/**
 * Sidebar Navigation Component
 * 
 * Fixed sidebar with navigation links, active state,
 * and hover effects. Dark background with Royal Blue accent.
 */
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/transactions', label: 'Transações', icon: '💸' },
    { href: '/categories', label: 'Categorias', icon: '🏷️' },
    { href: '/budgets', label: 'Orçamentos', icon: '📋' },
    { href: '/goals', label: 'Metas', icon: '🎯' },
    { href: '/reports', label: 'Relatórios', icon: '📈' },
    { href: '/import', label: 'Importar', icon: '📥' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>💰</span>
                <span className={styles.logoText}>FinancePro</span>
            </div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                            {isActive && <span className={styles.activeIndicator} />}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <div className={styles.version}>v1.0.0</div>
            </div>
        </aside>
    );
}
