export async function restoreGlobalVersion(sdk, options, init) {
    const response = await sdk.request({
        args: options,
        init,
        method: 'POST',
        path: `/globals/${options.slug}/versions/${options.id}`
    });
    const { doc } = await response.json();
    return doc;
}

//# sourceMappingURL=restoreVersion.js.map