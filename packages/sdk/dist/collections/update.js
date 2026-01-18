import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js';
export async function update(sdk, options, init) {
    let file = undefined;
    if (options.file) {
        file = await resolveFileFromOptions(options.file);
    }
    const response = await sdk.request({
        args: options,
        file,
        init,
        json: options.data,
        method: 'PATCH',
        path: `/${options.collection}${options.id ? `/${options.id}` : ''}`
    });
    const json = await response.json();
    if (options.id) {
        return json.doc;
    }
    return json;
}

//# sourceMappingURL=update.js.map