import { status as httpStatus } from 'http-status';
import { getRequestGlobal } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { isNumber } from '../../utilities/isNumber.js';
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js';
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js';
import { findOneOperation } from '../operations/findOne.js';
export const findOneHandler = async (req)=>{
    const globalConfig = getRequestGlobal(req);
    const { data, searchParams } = req;
    const depth = data ? data.depth : searchParams.get('depth');
    const flattenLocales = data ? data.flattenLocales : searchParams.has('flattenLocales') ? searchParams.get('flattenLocales') === 'true' : undefined;
    const result = await findOneOperation({
        slug: globalConfig.slug,
        data: data ? data?.data : searchParams.get('data') ? JSON.parse(searchParams.get('data')) : undefined,
        depth: isNumber(depth) ? Number(depth) : undefined,
        draft: data ? data.draft : searchParams.get('draft') === 'true',
        flattenLocales,
        globalConfig,
        populate: sanitizePopulateParam(req.query.populate),
        req,
        select: sanitizeSelectParam(req.query.select)
    });
    return Response.json(result, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=findOne.js.map