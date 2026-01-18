import nextEnvImport from '@next/env';
import { findUpSync } from '../utilities/findUp.js';
const { loadEnvConfig } = nextEnvImport;
/**
 * Try to find user's env files and load it. Uses the same algorithm next.js uses to parse env files, meaning this also supports .env.local, .env.development, .env.production, etc.
 */ export function loadEnv(path) {
    if (path?.length) {
        loadEnvConfig(path, true);
        return;
    }
    const dev = process.env.NODE_ENV !== 'production';
    const { loadedEnvFiles } = loadEnvConfig(process.cwd(), dev);
    if (!loadedEnvFiles?.length) {
        // use findUp to find the env file. So, run loadEnvConfig for every directory upwards
        findUpSync({
            // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
            condition: (dir)=>{
                const { loadedEnvFiles } = loadEnvConfig(dir, true);
                if (loadedEnvFiles?.length) {
                    return true;
                }
            },
            dir: process.cwd()
        });
    }
}

//# sourceMappingURL=loadEnv.js.map