"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const types_1 = require("../config/types");
const errors_1 = require("../errors");
const mockHandler_1 = __importDefault(require("./mockHandler"));
async function handleTransport(transport, email, logger) {
    try {
        await transport.verify();
    }
    catch (err) {
        logger.error(`There is an error with the email configuration you have provided. ${err}`);
    }
    return { ...email, transport };
}
const ensureConfigHasFrom = (emailConfig) => {
    if (!emailConfig.fromName || !emailConfig.fromAddress) {
        throw new errors_1.InvalidConfiguration('Email fromName and fromAddress must be configured when transport is configured');
    }
};
const handleMockAccount = async (emailConfig, logger) => {
    let mockAccount;
    try {
        mockAccount = await (0, mockHandler_1.default)(emailConfig);
        const { account: { web, user, pass } } = mockAccount;
        if (emailConfig.logMockCredentials) {
            logger.info('E-mail configured with mock configuration');
            logger.info(`Log into mock email provider at ${web}`);
            logger.info(`Mock email account username: ${user}`);
            logger.info(`Mock email account password: ${pass}`);
        }
    }
    catch (err) {
        logger.error('There was a problem setting up the mock email handler', err);
    }
    return mockAccount;
};
async function buildEmail(emailConfig, logger) {
    if ((0, types_1.hasTransport)(emailConfig) && emailConfig.transport) {
        ensureConfigHasFrom(emailConfig);
        const email = { ...emailConfig };
        const { transport } = emailConfig;
        return handleTransport(transport, email, logger);
    }
    if ((0, types_1.hasTransportOptions)(emailConfig) && emailConfig.transportOptions) {
        ensureConfigHasFrom(emailConfig);
        const email = { ...emailConfig };
        const transport = nodemailer_1.default.createTransport(emailConfig.transportOptions);
        return handleTransport(transport, email, logger);
    }
    return handleMockAccount(emailConfig, logger);
}
exports.default = buildEmail;
//# sourceMappingURL=build.js.map