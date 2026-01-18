export const downSQL: "  // Test predefined migration DOWN from payload package\n  payload.logger.info('Test migration DOWN from payload package executed')";
/**
 * Test predefined migration for testing plugin-style module specifier imports.
 * This is used in integration tests to verify that external packages (without @payloadcms/db-* prefix)
 * can export predefined migrations via their package.json exports.
 *
 * This tests the second code path in getPredefinedMigration.ts (lines 56-72)
 *
 * NOTE: This is a .js file (not .ts) because Node.js with --no-experimental-strip-types
 * cannot import .ts files via module specifiers. Absolute file paths work because Vitest's
 * loader intercepts file:// URLs, but module specifiers are resolved by Node.js first.
 */
export const imports: "";
export const upSQL: "  // Test predefined migration from payload/__testing__/predefinedMigration\n  payload.logger.info('Test migration UP from payload package executed')";
//# sourceMappingURL=predefinedMigration.d.ts.map