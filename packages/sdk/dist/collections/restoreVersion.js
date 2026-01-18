export async function restoreVersion(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'POST',
        path: `/${options.collection}/versions/${options.id}`
    });
    return response.json();
}

//# sourceMappingURL=restoreVersion.js.map