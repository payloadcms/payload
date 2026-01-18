export const getCacheUploadsAfterChangeHook = ({ endpoint })=>({ doc, operation, req })=>{
        if (!req || !process.env.PAYLOAD_CLOUD_CACHE_KEY) {
            return doc;
        }
        // WARNING:
        // TODO: Test this for 3.0
        const { payloadAPI } = req;
        if (payloadAPI !== 'local') {
            if (operation === 'update') {
                // Unawaited promise
                void purge({
                    doc,
                    endpoint,
                    operation,
                    req
                });
            }
        }
        return doc;
    };
export const getCacheUploadsAfterDeleteHook = ({ endpoint })=>({ doc, req })=>{
        if (!req || !process.env.PAYLOAD_CLOUD_CACHE_KEY) {
            return doc;
        }
        const { payloadAPI } = req;
        // WARNING:
        // TODO: Test this for 3.0
        if (payloadAPI !== 'local') {
            // Unawaited promise
            void purge({
                doc,
                endpoint,
                operation: 'delete',
                req
            });
        }
        return doc;
    };
async function purge({ doc, endpoint, operation, req }) {
    const filePath = doc.url;
    if (!filePath) {
        req.payload.logger.error({
            msg: 'No url found on doc',
            project: {
                id: process.env.PAYLOAD_CLOUD_PROJECT_ID
            }
        });
        return;
    }
    const body = {
        cacheKey: process.env.PAYLOAD_CLOUD_CACHE_KEY,
        filepath: doc.url,
        projectID: process.env.PAYLOAD_CLOUD_PROJECT_ID
    };
    req.payload.logger.debug({
        filepath: doc.url,
        msg: 'Attempting to purge cache',
        operation,
        project: {
            id: process.env.PAYLOAD_CLOUD_PROJECT_ID
        }
    });
    try {
        const purgeRes = await fetch(`${endpoint}/api/purge-cache`, {
            body: JSON.stringify({
                ...body
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });
        req.payload.logger.debug({
            msg: 'Purge cache result',
            operation,
            statusCode: purgeRes.status
        });
    } catch (err) {
        req.payload.logger.error({
            body,
            err,
            msg: '/purge-cache call failed'
        });
    }
}

//# sourceMappingURL=uploadCache.js.map