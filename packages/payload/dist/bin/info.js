import { execFileSync } from 'child_process';
import os from 'os';
import { getDependencies } from '../index.js';
import { PAYLOAD_PACKAGE_LIST } from '../versions/payloadPackageList.js';
export const info = async ()=>{
    const deps = await getDependencies(process.cwd(), [
        ...PAYLOAD_PACKAGE_LIST,
        'next',
        'react',
        'react-dom'
    ]);
    const formattedDeps = Array.from(deps.resolved.entries()).map(([name, { version }])=>({
            name,
            version
        }));
    console.log(generateOutput(formattedDeps));
};
function generateOutput(packages) {
    const cpuCores = os.cpus().length;
    const primaryDeps = packages.filter(({ name })=>name === 'payload' || name === 'next');
    const otherDeps = packages.filter(({ name })=>name !== 'payload' && name !== 'next').sort((a, b)=>a.name.localeCompare(b.name));
    const formattedDeps = [
        ...primaryDeps,
        ...otherDeps
    ].map(({ name, version })=>`  ${name}: ${version}`).join('\n');
    return `
Binaries:
  Node: ${process.versions.node}
  npm: ${getBinaryVersion('npm')}
  Yarn: ${getBinaryVersion('yarn')}
  pnpm: ${getBinaryVersion('pnpm')}
Relevant Packages:
${formattedDeps}
Operating System:
  Platform: ${os.platform()}
  Arch: ${os.arch()}
  Version: ${os.version()}
  Available memory (MB): ${Math.ceil(os.totalmem() / 1024 / 1024)}
  Available CPU cores: ${cpuCores > 0 ? cpuCores : 'N/A'}
`;
}
function getBinaryVersion(binaryName) {
    try {
        return execFileSync(binaryName, [
            '--version'
        ]).toString().trim();
    } catch  {
        return 'N/A';
    }
}
// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    void info();
}

//# sourceMappingURL=info.js.map