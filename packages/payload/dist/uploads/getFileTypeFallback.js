const extensionMap = {
    css: 'text/css',
    csv: 'text/csv',
    htm: 'text/html',
    html: 'text/html',
    js: 'application/javascript',
    json: 'application/json',
    md: 'text/markdown',
    svg: 'image/svg+xml',
    xml: 'application/xml',
    yml: 'application/x-yaml'
};
export const getFileTypeFallback = (path)=>{
    const ext = path.split('.').pop() || 'txt';
    return {
        ext,
        mime: extensionMap[ext] || 'text/plain'
    };
};

//# sourceMappingURL=getFileTypeFallback.js.map