"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const qs_1 = __importDefault(require("qs"));
const react_i18next_1 = require("react-i18next");
const Locale_1 = require("../components/utilities/Locale");
const api_1 = require("../api");
const usePayloadAPI = (url, options = {}) => {
    const { initialParams = {}, initialData = {}, } = options;
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const [data, setData] = (0, react_1.useState)(initialData);
    const [params, setParams] = (0, react_1.useState)(initialParams);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isError, setIsError] = (0, react_1.useState)(false);
    const locale = (0, Locale_1.useLocale)();
    const search = qs_1.default.stringify({
        locale,
        ...(typeof params === 'object' ? params : {}),
    }, {
        addQueryPrefix: true,
    });
    (0, react_1.useEffect)(() => {
        const abortController = new AbortController();
        const fetchData = async () => {
            setIsError(false);
            setIsLoading(true);
            try {
                const response = await api_1.requests.get(`${url}${search}`, {
                    signal: abortController.signal,
                    headers: {
                        'Accept-Language': i18n.language,
                    },
                });
                if (response.status > 201) {
                    setIsError(true);
                }
                const json = await response.json();
                setData(json);
                setIsLoading(false);
            }
            catch (error) {
                if (!abortController.signal.aborted) {
                    setIsError(true);
                    setIsLoading(false);
                }
            }
        };
        if (url) {
            fetchData();
        }
        else {
            setIsError(false);
            setIsLoading(false);
        }
        return () => {
            abortController.abort();
        };
    }, [url, locale, search, i18n.language]);
    return [{ data, isLoading, isError }, { setParams }];
};
exports.default = usePayloadAPI;
//# sourceMappingURL=usePayloadAPI.js.map