/**
 * Sanitizes user data for emails to prevent injection of HTML, executable code, or other malicious content.
 * This function ensures the content is safe by:
 * - Removing HTML tags
 * - Removing control characters
 * - Normalizing whitespace
 * - Escaping special HTML characters
 * - Allowing only letters, numbers, spaces, and basic punctuation
 * - Limiting length (default 100 characters)
 *
 * @param data - data to sanitize
 * @param maxLength - maximum allowed length (default is 100)
 * @returns a sanitized string safe to include in email content
 */
export declare function sanitizeUserDataForEmail(data: unknown, maxLength?: number): string;
//# sourceMappingURL=sanitizeUserDataForEmail.d.ts.map