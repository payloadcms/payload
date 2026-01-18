import { status as httpStatus } from 'http-status';
import { findOne } from '../operations/findOne.js';
export const findByIDHandler = async (incomingReq)=>{
    // We cannot import the addDataAndFileToRequest utility here from the 'next' package because of dependency issues
    // However that utility should be used where possible instead of manually appending the data
    let data;
    try {
        data = await incomingReq.json?.();
    } catch (ignore) {
        data = {};
    }
    const reqWithData = incomingReq;
    if (data) {
        reqWithData.data = data;
        // @ts-expect-error
        reqWithData.json = ()=>Promise.resolve(data);
    }
    const result = await findOne({
        key: reqWithData.routeParams?.key,
        req: reqWithData,
        user: reqWithData.user
    });
    return Response.json({
        ...result ? result : {
            message: reqWithData.t('general:notFound'),
            value: null
        }
    }, {
        status: httpStatus.OK
    });
};

//# sourceMappingURL=findOne.js.map