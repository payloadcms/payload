import type { NextConfigType } from '../types.js';
export declare const withPayloadStatement: {
    cjs: string;
    esm: string;
    ts: string;
};
export declare const wrapNextConfig: (args: {
    nextConfigPath: string;
    nextConfigType: NextConfigType;
}) => Promise<void>;
/**
 * Parses config content with AST and wraps it with withPayload function
 */
export declare function parseAndModifyConfigContent(content: string, configType: NextConfigType): Promise<{
    modifiedConfigContent: string;
    success: boolean;
}>;
//# sourceMappingURL=wrap-next-config.d.ts.map