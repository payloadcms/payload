"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const webpack_1 = __importDefault(require("webpack"));
const mockModulePath = path_1.default.resolve(__dirname, './mocks/emptyModule.js');
const mockDotENVPath = path_1.default.resolve(__dirname, './mocks/dotENV.js');
exports.default = (config) => ({
    entry: {
        main: [
            path_1.default.resolve(__dirname, '../admin'),
        ],
    },
    resolveLoader: {
        modules: ['node_modules', path_1.default.join(__dirname, '../../node_modules')],
    },
    module: {
        rules: [
            {
                test: /\.(t|j)sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('swc-loader'),
                        options: {
                            jsc: {
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                },
                            },
                        },
                    },
                ],
            },
            {
                oneOf: [
                    {
                        test: /\.(?:ico|gif|png|jpg|jpeg|woff(2)?|eot|ttf|otf|svg)$/i,
                        type: 'asset/resource',
                    },
                ],
            },
        ],
    },
    resolve: {
        fallback: {
            path: require.resolve('path-browserify'),
            crypto: false,
            https: false,
            http: false,
        },
        modules: ['node_modules', path_1.default.resolve(__dirname, '../../node_modules')],
        alias: {
            'payload-config': config.paths.rawConfig,
            payload$: mockModulePath,
            'payload-user-css': config.admin.css,
            dotenv: mockDotENVPath,
        },
        extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    plugins: [
        new webpack_1.default.ProvidePlugin({ process: 'process/browser' }),
        new webpack_1.default.DefinePlugin(Object.entries(process.env).reduce((values, [key, val]) => {
            if (key.indexOf('PAYLOAD_PUBLIC_') === 0) {
                return ({
                    ...values,
                    [`process.env.${key}`]: `'${val}'`,
                });
            }
            return values;
        }, {})),
        new html_webpack_plugin_1.default({
            template: config.admin.indexHTML,
            filename: path_1.default.normalize('./index.html'),
        }),
        new webpack_1.default.HotModuleReplacementPlugin(),
    ],
});
//# sourceMappingURL=getBaseConfig.js.map