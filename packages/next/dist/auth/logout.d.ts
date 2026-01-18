import type { SanitizedConfig } from 'payload';
export declare function logout({ allSessions, config, }: {
    allSessions?: boolean;
    config: Promise<SanitizedConfig> | SanitizedConfig;
}): Promise<{
    message: string;
    success: boolean;
}>;
//# sourceMappingURL=logout.d.ts.map