import { status as httpStatus } from 'http-status';
import { getRequestGlobal } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { isNumber } from '../../utilities/isNumber.js';
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js';
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js';
import { updateOperation } from '../operations/update.js';
export const updateHandler = async (req)=>{
    const globalConfig = getRequestGlobal(req);
    const { searchParams } = req;
    const depth = searchParams.get('depth');
    const draft = searchParams.get('draft') === 'true';
    const autosave = searchParams.get('autosave') === 'true';
    const publishSpecificLocale = req.query.publishSpecificLocale;
    const result = await updateOperation({
        slug: globalConfig.slug,
        autosave,
        data: req.data,
        depth: isNumber(depth) ? Number(depth) : undefined,
        draft,
        globalConfig,
        populate: sanitizePopulateParam(req.query.populate),
        publishSpecificLocale,
        req,
        select: sanitizeSelectParam(req.query.select)
    });
    let message = req.t('general:updatedSuccessfully');
    if (draft) {
        message = req.t('version:draftSavedSuccessfully');
    }
    if (autosave) {
        message = req.t('version:autosavedSuccessfully');
    }
    return Response.json({
        message,
        result
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=update.js.map