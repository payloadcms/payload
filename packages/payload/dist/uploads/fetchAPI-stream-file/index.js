import fs from 'fs';
export function iteratorToStream(iterator) {
    return new ReadableStream({
        async pull (controller) {
            const { done, value } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        }
    });
}
export async function* nodeStreamToIterator(stream) {
    for await (const chunk of stream){
        yield new Uint8Array(chunk);
    }
}
export function streamFile({ filePath, options }) {
    const nodeStream = fs.createReadStream(filePath, options);
    const data = iteratorToStream(nodeStreamToIterator(nodeStream));
    return data;
}

//# sourceMappingURL=index.js.map