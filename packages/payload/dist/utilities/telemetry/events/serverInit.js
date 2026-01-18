import { sendEvent } from '../index.js';
export const serverInit = (payload)=>{
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sendEvent({
        event: {
            type: 'server-init'
        },
        payload
    });
};

//# sourceMappingURL=serverInit.js.map