"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
const css_minimizer_webpack_plugin_1 = __importDefault(require("css-minimizer-webpack-plugin"));
exports.default = {
    entry: {
        main: [path_1.default.resolve(__dirname, '../admin/components/index.js')],
    },
    externals: {
        react: 'react',
    },
    output: {
        path: path_1.default.resolve(__dirname, '../../components'),
        publicPath: '/',
        filename: 'index.js',
        libraryTarget: 'commonjs2',
    },
    optimization: {
        minimizer: [new terser_webpack_plugin_1.default({
                extractComments: false,
            }), new css_minimizer_webpack_plugin_1.default({})],
    },
    mode: 'production',
    stats: 'errors-only',
    module: {
        rules: [
            {
                test: /\.(t|j)sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('swc-loader'),
                    },
                ],
            },
            {
                oneOf: [
                    {
                        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                        loader: require.resolve('url-loader'),
                        options: {
                            limit: 10000,
                            name: 'static/media/[name].[hash:8].[ext]',
                        },
                    },
                    {
                        test: /\.(sa|sc|c)ss$/,
                        sideEffects: true,
                        use: [
                            mini_css_extract_plugin_1.default.loader,
                            'css-loader',
                            {
                                loader: 'postcss-loader',
                                options: {
                                    postcssOptions: {
                                        plugins: [
                                            'postcss-preset-env',
                                        ],
                                    },
                                },
                            },
                            'sass-loader',
                        ],
                    },
                    {
                        exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
                        loader: require.resolve('file-loader'),
                        options: {
                            name: 'static/media/[name].[hash:8].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new mini_css_extract_plugin_1.default({
            filename: 'styles.css',
            ignoreOrder: true,
        }),
    ],
    resolve: {
        alias: {
            'payload-scss-overrides': path_1.default.resolve(__dirname, '../admin/scss/overrides.scss'),
        },
        modules: ['node_modules', path_1.default.resolve(__dirname, '../../node_modules')],
    },
};
//# sourceMappingURL=components.config.js.map