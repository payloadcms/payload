/**
 * Utility function to determine if the code is being executed during the Next.js build process.
 */ export function isNextBuild() {
    return process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';
}

//# sourceMappingURL=isNextBuild.js.map