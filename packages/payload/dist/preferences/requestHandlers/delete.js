import { status as httpStatus } from 'http-status';
import { deleteOperation } from '../operations/delete.js';
export const deleteHandler = async (incomingReq)=>{
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
    const result = await deleteOperation({
        key: reqWithData.routeParams?.key,
        req: reqWithData,
        user: reqWithData.user
    });
    return Response.json({
        ...result,
        message: reqWithData.t('general:deletedSuccessfully')
    }, {
        status: httpStatus.OK
    });
};

//# sourceMappingURL=delete.js.map