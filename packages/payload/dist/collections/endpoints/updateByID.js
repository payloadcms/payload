import { status as httpStatus } from 'http-status';
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { updateByIDOperation } from '../operations/updateByID.js';
export const updateByIDHandler = async (req)=>{
    const { id, collection } = getRequestCollectionWithID(req);
    const { autosave, depth, draft, overrideLock, populate, publishSpecificLocale, select, trash } = parseParams(req.query);
    const doc = await updateByIDOperation({
        id,
        autosave,
        collection,
        data: req.data,
        depth,
        draft,
        overrideLock: overrideLock ?? false,
        populate,
        publishSpecificLocale,
        req,
        select,
        trash
    });
    let message = req.t('general:updatedSuccessfully');
    if (draft) {
        message = req.t('version:draftSavedSuccessfully');
    }
    if (autosave) {
        message = req.t('version:autosavedSuccessfully');
    }
    return Response.json({
        doc,
        message
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=updateByID.js.map