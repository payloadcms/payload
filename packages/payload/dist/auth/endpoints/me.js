import { status as httpStatus } from 'http-status';
import { getRequestCollection } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { isNumber } from '../../utilities/isNumber.js';
import { sanitizeJoinParams } from '../../utilities/sanitizeJoinParams.js';
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js';
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js';
import { extractJWT } from '../extractJWT.js';
import { meOperation } from '../operations/me.js';
export const meHandler = async (req)=>{
    const { searchParams } = req;
    const collection = getRequestCollection(req);
    const currentToken = extractJWT(req);
    const depthFromSearchParams = searchParams.get('depth');
    const draftFromSearchParams = searchParams.get('depth');
    const { depth: depthFromQuery, draft: draftFromQuery, joins, populate, select } = req.query;
    const depth = depthFromQuery || depthFromSearchParams;
    const draft = draftFromQuery || draftFromSearchParams;
    const result = await meOperation({
        collection,
        currentToken: currentToken,
        depth: isNumber(depth) ? Number(depth) : undefined,
        draft: draft === 'true',
        joins: sanitizeJoinParams(joins),
        populate: sanitizePopulateParam(populate),
        req,
        select: sanitizeSelectParam(select)
    });
    if (collection.config.auth.removeTokenFromResponses) {
        delete result.token;
    }
    return Response.json({
        ...result,
        message: req.t('authentication:account')
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=me.js.map