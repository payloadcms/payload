"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const mockEmailHandler = async (emailConfig) => {
    const testAccount = await nodemailer_1.default.createTestAccount();
    const smtpOptions = {
        ...emailConfig,
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        fromName: emailConfig.fromName || 'Payload CMS',
        fromAddress: emailConfig.fromAddress || 'info@payloadcms.com',
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    };
    return {
        account: testAccount,
        transport: nodemailer_1.default.createTransport(smtpOptions),
    };
};
exports.default = mockEmailHandler;
//# sourceMappingURL=mockHandler.js.map