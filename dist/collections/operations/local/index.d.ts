import find from './find';
import findByID from './findByID';
import create from './create';
import update from './update';
import deleteLocal from './delete';
import findVersionByID from './findVersionByID';
import findVersions from './findVersions';
import restoreVersion from './restoreVersion';
declare const _default: {
    find: typeof find;
    findByID: typeof findByID;
    create: typeof create;
    update: typeof update;
    deleteLocal: typeof deleteLocal;
    auth: {
        login: typeof import("../../../auth/operations/local/login").default;
        forgotPassword: typeof import("../../../auth/operations/local/forgotPassword").default;
        resetPassword: typeof import("../../../auth/operations/local/resetPassword").default;
        unlock: typeof import("../../../auth/operations/local/unlock").default;
        verifyEmail: typeof import("../../../auth/operations/local/verifyEmail").default;
    };
    findVersionByID: typeof findVersionByID;
    findVersions: typeof findVersions;
    restoreVersion: typeof restoreVersion;
};
export default _default;
