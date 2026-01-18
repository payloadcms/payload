import { getTranslation } from '@payloadcms/translations';
import { status as httpStatus } from 'http-status';
import { getRequestCollection } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { parseParams } from '../../utilities/parseParams/index.js';
import { createOperation } from '../operations/create.js';
export const createHandler = async (req)=>{
    const collection = getRequestCollection(req);
    const { autosave, depth, draft, populate, select } = parseParams(req.query);
    const publishSpecificLocale = req.query.publishSpecificLocale;
    const doc = await createOperation({
        autosave,
        collection,
        data: req.data,
        depth,
        draft,
        populate,
        publishSpecificLocale,
        req,
        select
    });
    return Response.json({
        doc,
        message: req.t('general:successfullyCreated', {
            label: getTranslation(collection.config.labels.singular, req.i18n)
        })
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.CREATED
    });
};

//# sourceMappingURL=create.js.map