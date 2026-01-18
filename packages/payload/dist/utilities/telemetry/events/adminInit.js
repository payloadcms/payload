import { sendEvent } from '../index.js';
import { oneWayHash } from '../oneWayHash.js';
export const adminInit = ({ headers, payload, user })=>{
    const host = headers.get('host');
    let domainID;
    let userID;
    if (host) {
        domainID = oneWayHash(host, payload.secret);
    }
    if (user?.id) {
        userID = oneWayHash(String(user.id), payload.secret);
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sendEvent({
        event: {
            type: 'admin-init',
            domainID: domainID,
            userID: userID
        },
        payload
    });
};

//# sourceMappingURL=adminInit.js.map