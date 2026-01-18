export const parseCookies = (headers)=>{
    const list = new Map();
    const rc = headers.get('Cookie');
    if (rc) {
        rc.split(';').forEach((cookie)=>{
            const parts = cookie.split('=');
            const key = parts.shift()?.trim();
            const encodedValue = parts.join('=');
            try {
                const decodedValue = decodeURI(encodedValue);
                list.set(key, decodedValue);
            } catch  {
            // ignore invalid encoded values
            }
        });
    }
    return list;
};

//# sourceMappingURL=parseCookies.js.map