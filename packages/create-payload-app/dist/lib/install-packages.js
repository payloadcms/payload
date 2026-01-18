import execa from 'execa';
import { error, warning } from '../utils/log.js';
export async function installPackages(args) {
    const { packageManager, packagesToInstall, projectDir } = args;
    let exitCode = 0;
    let stderr = '';
    switch(packageManager){
        case 'bun':
        case 'pnpm':
        case 'yarn':
            {
                if (packageManager === 'bun') {
                    warning('Bun support is untested.');
                }
                ;
                ({ exitCode, stderr } = await execa(packageManager, [
                    'add',
                    ...packagesToInstall
                ], {
                    cwd: projectDir,
                    env: {
                        ...process.env,
                        ...packageManager === 'pnpm' && {
                            npm_config_ignore_workspace_root_check: 'true'
                        }
                    }
                }));
                break;
            }
        case 'npm':
            {
                ;
                ({ exitCode, stderr } = await execa('npm', [
                    'install',
                    '--save',
                    ...packagesToInstall
                ], {
                    cwd: projectDir
                }));
                break;
            }
    }
    if (exitCode !== 0) {
        error(`Unable to install packages. Error: ${stderr}`);
    }
    return {
        success: exitCode === 0
    };
}

//# sourceMappingURL=install-packages.js.map