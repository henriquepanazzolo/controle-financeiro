/**
 * Currency Formatting Utilities
 * 
 * Formats monetary values for display in Brazilian Real (BRL).
 * 
 * @module utils/formatCurrency
 */

/**
 * Formats a number as Brazilian Real currency.
 * 
 * @param value - The monetary value to format
 * @returns Formatted string like "R$ 1.234,56"
 * 
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(0)       // "R$ 0,00"
 * formatCurrency(-500)    // "-R$ 500,00"
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Formats a number as a compact currency (abbreviated).
 * 
 * @param value - The monetary value to format
 * @returns Formatted string like "R$ 1,2 mil"
 * 
 * @example
 * formatCurrencyCompact(1500)    // "R$ 1,5 mil"
 * formatCurrencyCompact(1000000) // "R$ 1 mi"
 */
export function formatCurrencyCompact(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        compactDisplay: 'short',
    }).format(value);
}
