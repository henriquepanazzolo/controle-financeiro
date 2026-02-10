/**
 * Date Formatting Utilities
 * 
 * Formats dates for display using Brazilian locale.
 * 
 * @module utils/formatDate
 */

/**
 * Formats a Date to Brazilian short date format.
 * @param date - The date to format
 * @returns Formatted string like "09/02/2026"
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
}

/**
 * Formats a Date with the month name.
 * @param date - The date to format
 * @returns Formatted string like "09 de fevereiro de 2026"
 */
export function formatDateLong(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(d);
}

/**
 * Gets month name from a month number.
 * @param month - Month number (1-12)
 * @returns Month name like "Janeiro", "Fevereiro", etc.
 */
export function getMonthName(month: number): string {
    const date = new Date(2026, month - 1, 1);
    const name = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Gets the current month and year.
 * @returns Object with { month, year }
 */
export function getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
}
