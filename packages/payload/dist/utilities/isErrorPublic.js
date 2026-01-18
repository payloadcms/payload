import { status as httpStatus } from 'http-status';
/**
 * Determines if an error should be shown to the user.
 */ export function isErrorPublic(error, config) {
    const payloadError = error;
    if (config.debug) {
        return true;
    }
    if (payloadError.isPublic === true) {
        return true;
    }
    if (payloadError.isPublic === false) {
        return false;
    }
    if (payloadError.status && payloadError.status !== httpStatus.INTERNAL_SERVER_ERROR) {
        return true;
    }
    return false;
}

//# sourceMappingURL=isErrorPublic.js.map