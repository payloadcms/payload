"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
const executeAccess_1 = __importDefault(require("../../auth/executeAccess"));
const sanitizeInternalFields_1 = __importDefault(require("../../utilities/sanitizeInternalFields"));
const errors_1 = require("../../errors");
const sendVerificationEmail_1 = __importDefault(require("../../auth/sendVerificationEmail"));
const types_1 = require("../../fields/config/types");
const uploadFiles_1 = require("../../uploads/uploadFiles");
const beforeChange_1 = require("../../fields/hooks/beforeChange");
const beforeValidate_1 = require("../../fields/hooks/beforeValidate");
const afterChange_1 = require("../../fields/hooks/afterChange");
const afterRead_1 = require("../../fields/hooks/afterRead");
const generateFileData_1 = require("../../uploads/generateFileData");
const saveVersion_1 = require("../../versions/saveVersion");
const mapAsync_1 = require("../../utilities/mapAsync");
const unlinkFile = (0, util_1.promisify)(fs_1.default.unlink);
async function create(incomingArgs) {
    var _a;
    let args = incomingArgs;
    // /////////////////////////////////////
    // beforeOperation - Collection
    // /////////////////////////////////////
    await args.collection.config.hooks.beforeOperation.reduce(async (priorHook, hook) => {
        await priorHook;
        args = (await hook({
            args,
            operation: 'create',
        })) || args;
    }, Promise.resolve());
    const { collection, collection: { Model, config: collectionConfig, }, req, req: { payload, payload: { config, emailOptions, }, }, disableVerificationEmail, depth, overrideAccess, showHiddenFields, overwriteExistingFiles = false, draft = false, autosave = false, } = args;
    let { data } = args;
    const shouldSaveDraft = Boolean(draft && collectionConfig.versions.drafts);
    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////
    if (!overrideAccess) {
        await (0, executeAccess_1.default)({ req, data }, collectionConfig.access.create);
    }
    // /////////////////////////////////////
    // Custom id
    // /////////////////////////////////////
    const hasIdField = collectionConfig.fields.findIndex((field) => (0, types_1.fieldAffectsData)(field) && field.name === 'id') > -1;
    if (hasIdField) {
        data = {
            _id: data.id,
            ...data,
        };
    }
    // /////////////////////////////////////
    // Generate data for all files and sizes
    // /////////////////////////////////////
    const { data: newFileData, files: filesToUpload } = await (0, generateFileData_1.generateFileData)({
        config,
        collection,
        req,
        data,
        throwOnMissingFile: !shouldSaveDraft,
        overwriteExistingFiles,
    });
    data = newFileData;
    // /////////////////////////////////////
    // beforeValidate - Fields
    // /////////////////////////////////////
    data = await (0, beforeValidate_1.beforeValidate)({
        data,
        doc: {},
        entityConfig: collectionConfig,
        operation: 'create',
        overrideAccess,
        req,
    });
    // /////////////////////////////////////
    // beforeValidate - Collections
    // /////////////////////////////////////
    await collectionConfig.hooks.beforeValidate.reduce(async (priorHook, hook) => {
        await priorHook;
        data = (await hook({
            data,
            req,
            operation: 'create',
        })) || data;
    }, Promise.resolve());
    // /////////////////////////////////////
    // Write files to local storage
    // /////////////////////////////////////
    if (!collectionConfig.upload.disableLocalStorage) {
        await (0, uploadFiles_1.uploadFiles)(payload, filesToUpload, req.t);
    }
    // /////////////////////////////////////
    // beforeChange - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.beforeChange.reduce(async (priorHook, hook) => {
        await priorHook;
        data = (await hook({
            data,
            req,
            operation: 'create',
        })) || data;
    }, Promise.resolve());
    // /////////////////////////////////////
    // beforeChange - Fields
    // /////////////////////////////////////
    const resultWithLocales = await (0, beforeChange_1.beforeChange)({
        data,
        doc: {},
        docWithLocales: {},
        entityConfig: collectionConfig,
        operation: 'create',
        req,
        skipValidation: shouldSaveDraft,
    });
    // /////////////////////////////////////
    // Create
    // /////////////////////////////////////
    let doc;
    if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
        if (data.email) {
            resultWithLocales.email = data.email.toLowerCase();
        }
        if (collectionConfig.auth.verify) {
            resultWithLocales._verified = Boolean(resultWithLocales._verified) || false;
            resultWithLocales._verificationToken = crypto_1.default.randomBytes(20).toString('hex');
        }
        try {
            doc = await Model.register(resultWithLocales, data.password);
        }
        catch (error) {
            // Handle user already exists from passport-local-mongoose
            if (error.name === 'UserExistsError') {
                throw new errors_1.ValidationError([{ message: error.message, field: 'email' }], req.t);
            }
            throw error;
        }
    }
    else {
        try {
            doc = await Model.create(resultWithLocales);
        }
        catch (error) {
            // Handle uniqueness error from MongoDB
            throw error.code === 11000 && error.keyValue
                ? new errors_1.ValidationError([{ message: req.t('error:valueMustBeUnique'), field: Object.keys(error.keyValue)[0] }], req.t)
                : error;
        }
    }
    let result = doc.toJSON({ virtuals: true });
    const verificationToken = result._verificationToken;
    // custom id type reset
    result.id = result._id;
    result = JSON.parse(JSON.stringify(result));
    result = (0, sanitizeInternalFields_1.default)(result);
    // /////////////////////////////////////
    // Create version
    // /////////////////////////////////////
    if (collectionConfig.versions) {
        await (0, saveVersion_1.saveVersion)({
            payload,
            collection: collectionConfig,
            req,
            id: result.id,
            docWithLocales: result,
            autosave,
        });
    }
    // /////////////////////////////////////
    // Send verification email if applicable
    // /////////////////////////////////////
    if (collectionConfig.auth && collectionConfig.auth.verify) {
        (0, sendVerificationEmail_1.default)({
            emailOptions,
            config: payload.config,
            sendEmail: payload.sendEmail,
            collection: { config: collectionConfig, Model },
            user: result,
            token: verificationToken,
            req,
            disableEmail: disableVerificationEmail,
        });
    }
    // /////////////////////////////////////
    // afterRead - Fields
    // /////////////////////////////////////
    result = await (0, afterRead_1.afterRead)({
        depth,
        doc: result,
        entityConfig: collectionConfig,
        overrideAccess,
        req,
        showHiddenFields,
    });
    // /////////////////////////////////////
    // afterRead - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterRead.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({
            req,
            doc: result,
        }) || result;
    }, Promise.resolve());
    // /////////////////////////////////////
    // afterChange - Fields
    // /////////////////////////////////////
    result = await (0, afterChange_1.afterChange)({
        data,
        doc: result,
        previousDoc: {},
        entityConfig: collectionConfig,
        operation: 'create',
        req,
    });
    // /////////////////////////////////////
    // afterChange - Collection
    // /////////////////////////////////////
    await collectionConfig.hooks.afterChange.reduce(async (priorHook, hook) => {
        await priorHook;
        result = await hook({
            doc: result,
            previousDoc: {},
            req: args.req,
            operation: 'create',
        }) || result;
    }, Promise.resolve());
    // Remove temp files if enabled, as express-fileupload does not do this automatically
    if (((_a = config.upload) === null || _a === void 0 ? void 0 : _a.useTempFiles) && collectionConfig.upload) {
        const { files } = req;
        const fileArray = Array.isArray(files) ? files : [files];
        await (0, mapAsync_1.mapAsync)(fileArray, async ({ file }) => {
            // Still need this check because this will not be populated if using local API
            if (file.tempFilePath) {
                await unlinkFile(file.tempFilePath);
            }
        });
    }
    // /////////////////////////////////////
    // Return results
    // /////////////////////////////////////
    return result;
}
exports.default = create;
//# sourceMappingURL=create.js.map