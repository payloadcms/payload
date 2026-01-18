import { status as httpStatus } from 'http-status';
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { verifyEmailOperation } from '../operations/verifyEmail.js';
export const verifyEmailHandler = async (req)=>{
    const { id, collection } = getRequestCollectionWithID(req, {
        disableSanitize: true
    });
    const { t } = req;
    await verifyEmailOperation({
        collection,
        req,
        token: id
    });
    return Response.json({
        message: t('authentication:accountVerified')
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        }),
        status: httpStatus.OK
    });
};

//# sourceMappingURL=verifyEmail.js.map