"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
const webpack_bundle_analyzer_1 = require("webpack-bundle-analyzer");
const getBaseConfig_1 = __importDefault(require("./getBaseConfig"));
// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
const SwcMinifyWebpackPlugin = require('swc-minify-webpack-plugin');
exports.default = (payloadConfig) => {
    const baseConfig = (0, getBaseConfig_1.default)(payloadConfig);
    let config = {
        ...baseConfig,
        output: {
            publicPath: `${payloadConfig.routes.admin}/`,
            path: payloadConfig.admin.buildPath,
            filename: '[name].[chunkhash].js',
            chunkFilename: '[name].[chunkhash].js',
        },
        mode: 'production',
        stats: 'errors-only',
        optimization: {
            minimizer: [new SwcMinifyWebpackPlugin()],
            splitChunks: {
                cacheGroups: {
                    styles: {
                        name: 'styles',
                        test: /\.(sa|sc|c)ss$/,
                        chunks: 'all',
                        enforce: true,
                    },
                },
            },
        },
        plugins: [
            ...baseConfig.plugins,
            new mini_css_extract_plugin_1.default({
                filename: '[name].css',
                ignoreOrder: true,
            }),
        ],
    };
    config.module.rules.push({
        test: /\.(scss|css)$/,
        sideEffects: true,
        use: [
            mini_css_extract_plugin_1.default.loader,
            {
                loader: require.resolve('css-loader'),
                options: {
                    url: (url) => (!url.startsWith('/')),
                },
            },
            {
                loader: require.resolve('postcss-loader'),
                options: {
                    postcssOptions: {
                        plugins: [require.resolve('postcss-preset-env')],
                    },
                },
            },
            require.resolve('sass-loader'),
        ],
    });
    if (process.env.PAYLOAD_ANALYZE_BUNDLE) {
        config.plugins.push(new webpack_bundle_analyzer_1.BundleAnalyzerPlugin());
    }
    if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
        config = payloadConfig.admin.webpack(config);
    }
    return config;
};
//# sourceMappingURL=getProdConfig.js.map