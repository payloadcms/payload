import { status as httpStatus } from 'http-status';
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { restoreVersionOperation } from '../operations/restoreVersion.js';
export const restoreVersionHandler = async (req)=>{
    const { id, collection } = getRequestCollectionWithID(req);
    const { depth, draft, populate } = parseParams(req.query);
    const result = await restoreVersionOperation({
        id,
        collection,
        depth,
        draft,
        populate,
        req
    });
    return Response.json({
        ...result,
        message: req.t('version:restoredSuccessfully')
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=restoreVersion.js.map