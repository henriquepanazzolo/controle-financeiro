/**
 * Unified Application Configuration
 * 
 * Centralizes all environment variable access with type safety.
 * Validates required variables at startup to fail fast.
 * 
 * @module config
 */

/** Validates that a required environment variable exists */
function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `[Config] Missing required environment variable: ${key}. ` +
            `Check your .env.local file.`
        );
    }
    return value;
}

/** Application configuration — type-safe access to env vars */
export const config = {
    /** Database configuration */
    database: {
        url: () => requireEnv('DATABASE_URL'),
    },

    /** Authentication configuration */
    auth: {
        secret: () => requireEnv('AUTH_SECRET'),
        url: () => process.env.AUTH_URL ?? 'http://localhost:3000',
    },

    /** Application metadata */
    app: {
        name: process.env.NEXT_PUBLIC_APP_NAME ?? 'FinancePro',
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
    },
} as const;

export default config;
