export const isURLAllowed = (url, allowList)=>{
    try {
        const parsedUrl = new URL(url);
        return allowList.some((allowItem)=>{
            return Object.entries(allowItem).every(([key, value])=>{
                // Skip undefined or null values
                if (!value) {
                    return true;
                }
                // Compare protocol with colon
                if (key === 'protocol') {
                    return typeof value === 'string' && parsedUrl.protocol === `${value}:`;
                }
                if (key === 'pathname') {
                    // Convert wildcards to a regex
                    const regexPattern = value.replace(/\*\*/g, '.*') // Match any path
                    .replace(/\*/g, '[^/]*') // Match any part of a path segment
                    .replace(/\/$/, '(/)?') // Allow optional trailing slash
                    ;
                    const regex = new RegExp(`^${regexPattern}$`);
                    return regex.test(parsedUrl.pathname);
                }
                // Default comparison for all other properties (hostname, port, search)
                return parsedUrl[key] === value;
            });
        });
    } catch  {
        return false // If the URL is invalid, deny by default
        ;
    }
};

//# sourceMappingURL=isURLAllowed.js.map