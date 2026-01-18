import { getTranslation } from '@payloadcms/translations';
import { status as httpStatus } from 'http-status';
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { duplicateOperation } from '../operations/duplicate.js';
export const duplicateHandler = async (req)=>{
    const { id, collection } = getRequestCollectionWithID(req);
    const { depth, draft, populate, select, selectedLocales } = parseParams(req.query);
    const doc = await duplicateOperation({
        id,
        collection,
        data: req.data,
        depth,
        draft,
        populate,
        req,
        select,
        selectedLocales
    });
    const message = req.t('general:successfullyDuplicated', {
        label: getTranslation(collection.config.labels.singular, req.i18n)
    });
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

//# sourceMappingURL=duplicate.js.map