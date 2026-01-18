import { status as httpStatus } from 'http-status';
import { restoreVersionOperationGlobal, sanitizePopulateParam } from '../../index.js';
import { getRequestGlobal } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { isNumber } from '../../utilities/isNumber.js';
export const restoreVersionHandler = async (req)=>{
    const globalConfig = getRequestGlobal(req);
    const { searchParams } = req;
    const depth = searchParams.get('depth');
    const draft = searchParams.get('draft');
    const doc = await restoreVersionOperationGlobal({
        id: req.routeParams.id,
        depth: isNumber(depth) ? Number(depth) : undefined,
        draft: draft === 'true' ? true : undefined,
        globalConfig,
        populate: sanitizePopulateParam(req.query.populate),
        req
    });
    return Response.json({
        doc,
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