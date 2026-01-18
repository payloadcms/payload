export const registerTool = (isEnabled, toolType, registrationFn, payload, useVerboseLogs)=>{
    if (isEnabled) {
        try {
            registrationFn();
            if (useVerboseLogs) {
                payload.logger.info(`[payload-mcp] ✅ Tool: ${toolType} Registered.`);
            }
        } catch (error) {
            // Log the error and re-throw
            payload.logger.info(`[payload-mcp] ❌ Tool: ${toolType} Failed to register.`);
            throw error;
        }
    } else if (useVerboseLogs) {
        payload.logger.info(`[payload-mcp] ⏭️ Tool: ${toolType} Skipped.`);
    }
};

//# sourceMappingURL=registerTool.js.map