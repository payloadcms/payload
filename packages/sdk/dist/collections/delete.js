export async function deleteOperation(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'DELETE',
        path: `/${options.collection}${options.id ? `/${options.id}` : ''}`
    });
    const json = await response.json();
    if (options.id) {
        return json.doc;
    }
    return json;
}

//# sourceMappingURL=delete.js.map