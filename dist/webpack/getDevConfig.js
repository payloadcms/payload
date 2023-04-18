"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = __importDefault(require("webpack"));
const md5_1 = __importDefault(require("md5"));
const getBaseConfig_1 = __importDefault(require("./getBaseConfig"));
exports.default = (payloadConfig) => {
    const baseConfig = (0, getBaseConfig_1.default)(payloadConfig);
    let config = {
        ...baseConfig,
        cache: {
            type: 'filesystem',
            // version cache when there are changes to aliases
            version: (0, md5_1.default)(Object.entries(baseConfig.resolve.alias).join()),
            buildDependencies: {
                config: [__filename],
            },
        },
        entry: {
            ...baseConfig.entry,
            main: [
                require.resolve('webpack-hot-middleware/client'),
                ...baseConfig.entry.main,
            ],
        },
        output: {
            publicPath: payloadConfig.routes.admin,
            path: '/',
            filename: '[name].js',
        },
        devtool: 'inline-source-map',
        mode: 'development',
        stats: 'errors-warnings',
        plugins: [
            ...baseConfig.plugins,
            new webpack_1.default.HotModuleReplacementPlugin(),
        ],
    };
    config.module.rules.push({
        test: /\.(scss|css)$/,
        sideEffects: true,
        use: [
            require.resolve('style-loader'),
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
    if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
        config = payloadConfig.admin.webpack(config);
    }
    return config;
};
//# sourceMappingURL=getDevConfig.js.map