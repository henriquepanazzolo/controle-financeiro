/**
 * Import Utilities
 * 
 * Utility functions for import processing that can be used
 * both on server and client side.
 * 
 * @module utils/importUtils
 */
import crypto from 'crypto';

/**
 * Generates a unique external ID for a transaction (SHA-256 hash).
 * Uses date + amount + description to create a deterministic hash.
 */
export function generateExternalId(date: Date, amount: number, description: string): string {
    const key = `${date.toISOString()}-${amount}-${description.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(key).digest('hex');
}
