exports.Meta = require('../dist/admin/components/utilities/Meta');

const { useLocale } = require('../dist/admin/components/utilities/Locale');
const { useDocumentInfo } = require('../dist/admin/components/utilities/DocumentInfo');
const { useConfig } = require('../dist/admin/components/utilities/Config');
const { useAuth } = require('../dist/admin/components/utilities/Auth');
const { useEditDepth } = require('../dist/admin/components/utilities/EditDepth');

exports.useLocale = useLocale;
exports.useDocumentInfo = useDocumentInfo;
exports.useConfig = useConfig;
exports.useAuth = useAuth;
exports.useEditDepth = useEditDepth;
