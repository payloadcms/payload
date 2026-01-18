import { resolveFileFromOptions } from '../utilities/resolveFileFromOptions.js';
export async function create(sdk, options, init) {
    let file = undefined;
    if (options.file) {
        file = await resolveFileFromOptions(options.file);
    }
    const response = await sdk.request({
        args: options,
        file,
        init,
        json: options.data,
        method: 'POST',
        path: `/${options.collection}`
    });
    const json = await response.json();
    return json.doc;
}

//# sourceMappingURL=create.js.map