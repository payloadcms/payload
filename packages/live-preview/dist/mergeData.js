const defaultRequestHandler = ({ apiPath, data, endpoint, serverURL })=>{
    const url = `${serverURL}${apiPath}/${endpoint}`;
    return fetch(url, {
        body: JSON.stringify(data),
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-Payload-HTTP-Method-Override': 'GET'
        },
        method: 'POST'
    });
};
export const mergeData = async (args)=>{
    const { apiRoute, collectionSlug, depth, globalSlug, incomingData, initialData, locale, serverURL } = args;
    const requestHandler = args.requestHandler || defaultRequestHandler;
    const result = await requestHandler({
        apiPath: apiRoute || '/api',
        data: {
            data: incomingData,
            depth,
            // The incoming data already has had its locales flattened
            flattenLocales: false,
            locale
        },
        endpoint: encodeURI(`${globalSlug ? 'globals/' : ''}${collectionSlug ?? globalSlug}${collectionSlug ? `/${initialData.id}` : ''}`),
        serverURL
    }).then((res)=>res.json());
    return result;
};

//# sourceMappingURL=mergeData.js.map