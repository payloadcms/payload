export const logError = ({ err, payload })=>{
    let level = 'error';
    if (err && typeof err === 'object' && 'name' in err && typeof err.name === 'string' && typeof payload.config.loggingLevels[err.name] !== 'undefined') {
        level = payload.config.loggingLevels[err.name];
    }
    if (level) {
        const logObject = {};
        if (level === 'info') {
            logObject.msg = typeof err === 'object' && 'message' in err ? err.message : 'Error';
        } else {
            logObject.err = err;
        }
        payload.logger[level](logObject);
    }
};

//# sourceMappingURL=logError.js.map