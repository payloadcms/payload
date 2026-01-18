import { status as httpStatus } from 'http-status';
import { update } from '../operations/update.js';
export const updateHandler = async (incomingReq)=>{
    // We cannot import the addDataAndFileToRequest utility here from the 'next' package because of dependency issues
    // However that utility should be used where possible instead of manually appending the data
    let data;
    try {
        data = await incomingReq.json?.();
    } catch (_err) {
        data = {};
    }
    const reqWithData = incomingReq;
    if (data) {
        reqWithData.data = data;
        // @ts-expect-error
        reqWithData.json = ()=>Promise.resolve(data);
    }
    const doc = await update({
        key: reqWithData.routeParams?.key,
        req: reqWithData,
        user: reqWithData?.user,
        value: reqWithData.data?.value || reqWithData.data
    });
    return Response.json({
        doc,
        message: reqWithData.t('general:updatedSuccessfully')
    }, {
        status: httpStatus.OK
    });
};

//# sourceMappingURL=update.js.map