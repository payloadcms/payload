import { getRequestCollection } from '../../utilities/getRequestEntity.js';
import { headersWithCors } from '../../utilities/headersWithCors.js';
import { initOperation } from '../operations/init.js';
export const initHandler = async (req)=>{
    const initialized = await initOperation({
        collection: getRequestCollection(req).config.slug,
        req
    });
    return Response.json({
        initialized
    }, {
        headers: headersWithCors({
            headers: new Headers(),
            req
        })
    });
};

//# sourceMappingURL=init.js.map