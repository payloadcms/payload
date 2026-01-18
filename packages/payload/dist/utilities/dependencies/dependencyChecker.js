import path from 'path';
import { fileURLToPath } from 'url';
import { getDependencies } from '../../index.js';
import { compareVersions } from './versionUtils.js';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export async function checkDependencies({ dependencyGroups, dependencyVersions }) {
    if (dependencyGroups?.length) {
        for (const dependencyGroup of dependencyGroups){
            const resolvedDependencies = await getDependencies(dirname, dependencyGroup.dependencies);
            // Go through each resolved dependency. If any dependency has a mismatching version, throw an error
            const foundVersions = {};
            for (const [_pkg, { version }] of resolvedDependencies.resolved){
                if (!Object.keys(foundVersions).includes(version)) {
                    foundVersions[version] = _pkg;
                }
            }
            if (Object.keys(foundVersions).length > 1) {
                const targetVersion = dependencyGroup.targetVersion ?? resolvedDependencies.resolved.get(dependencyGroup.targetVersionDependency)?.version;
                if (targetVersion) {
                    const formattedVersionsWithPackageNameString = Object.entries(foundVersions).filter(([version])=>version !== targetVersion).map(([version, pkg])=>`${pkg}@${version} (Please change this to ${targetVersion})`).join(', ');
                    throw new Error(`Mismatching "${dependencyGroup.name}" dependency versions found: ${formattedVersionsWithPackageNameString}. All "${dependencyGroup.name}" packages must have the same version. This is an error with your set-up, not a bug in Payload. Please go to your package.json and ensure all "${dependencyGroup.name}" packages have the same version.`);
                } else {
                    const formattedVersionsWithPackageNameString = Object.entries(foundVersions).map(([version, pkg])=>`${pkg}@${version}`).join(', ');
                    throw new Error(`Mismatching "${dependencyGroup.name}" dependency versions found: ${formattedVersionsWithPackageNameString}. All "${dependencyGroup.name}" packages must have the same version. This is an error with your set-up, not a bug in Payload. Please go to your package.json and ensure all "${dependencyGroup.name}" packages have the same version.`);
                }
            }
        }
    }
    if (dependencyVersions && Object.keys(dependencyVersions).length) {
        const resolvedDependencies = await getDependencies(dirname, Object.keys(dependencyVersions));
        for (const [dependency, settings] of Object.entries(dependencyVersions)){
            const resolvedDependency = resolvedDependencies.resolved.get(dependency);
            if (!resolvedDependency) {
                if (!settings.required) {
                    continue;
                }
                throw new Error(`Dependency ${dependency} not found. Please ensure it is installed.`);
            }
            if (settings.version) {
                const settingsVersionToCheck = settings.version.startsWith('>=') ? settings.version.slice(2) : settings.version;
                const versionCompareResult = compareVersions(resolvedDependency.version, settingsVersionToCheck, settings.customVersionParser);
                if (settings.version.startsWith('>=')) {
                    if (versionCompareResult === 'lower') {
                        throw new Error(`Dependency ${dependency} is on version ${resolvedDependency.version}, but ${settings.version} or greater is required. Please update this dependency.`);
                    }
                } else if (versionCompareResult === 'lower' || versionCompareResult === 'greater') {
                    throw new Error(`Dependency ${dependency} is on version ${resolvedDependency.version}, but ${settings.version} is required. Please update this dependency.`);
                }
            }
        }
    }
}

//# sourceMappingURL=dependencyChecker.js.map