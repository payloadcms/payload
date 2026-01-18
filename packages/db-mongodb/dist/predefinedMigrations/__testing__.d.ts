/**
 * Test predefined migration for testing plugin-style module specifier imports.
 * This is used in integration tests to verify that external packages can export
 * predefined migrations via their package.json exports.
 */
declare const imports = "";
declare const upSQL = "  // Test predefined migration from @payloadcms/db-mongodb/__testing__\n  payload.logger.info('Test migration UP executed')";
declare const downSQL = "  // Test predefined migration DOWN\n  payload.logger.info('Test migration DOWN executed')";
export { downSQL, imports, upSQL };
//# sourceMappingURL=__testing__.d.ts.map