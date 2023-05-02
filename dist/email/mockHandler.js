"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const defaults_1 = require("./defaults");
const mockEmailHandler = async (emailConfig) => {
    const testAccount = await nodemailer_1.default.createTestAccount();
    const smtpOptions = {
        ...emailConfig,
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        fromName: (emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.fromName) || defaults_1.defaults.fromName,
        fromAddress: (emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.fromAddress) || defaults_1.defaults.fromAddress,
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