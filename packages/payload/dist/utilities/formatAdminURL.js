export const formatAdminURL = (args)=>{
    const { adminRoute, apiRoute, includeBasePath: includeBasePathArg, path = '', relative = false, serverURL } = args;
    const basePath = process.env.NEXT_BASE_PATH || args.basePath || '';
    const routePath = adminRoute || apiRoute;
    const segments = [
        routePath && routePath !== '/' && routePath,
        path && path
    ].filter(Boolean);
    const pathname = segments.join('') || '/';
    const pathnameWithBase = (basePath + pathname).replace(/\/$/, '') || '/';
    const includeBasePath = includeBasePathArg ?? (adminRoute ? false : true);
    if (relative || !serverURL) {
        if (includeBasePath && basePath) {
            return pathnameWithBase;
        }
        return pathname;
    }
    const serverURLObj = new URL(serverURL);
    return new URL(pathnameWithBase, serverURLObj.origin).toString();
};

//# sourceMappingURL=formatAdminURL.js.map