import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import TerserJSPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin';
declare const _default: {
    entry: {
        main: string[];
    };
    externals: {
        react: string;
    };
    output: {
        path: string;
        publicPath: string;
        filename: string;
        libraryTarget: string;
    };
    optimization: {
        minimizer: (TerserJSPlugin<import("terser").MinifyOptions> | OptimizeCSSAssetsPlugin<OptimizeCSSAssetsPlugin.CssNanoOptionsExtended>)[];
    };
    mode: string;
    stats: string;
    module: {
        rules: ({
            test: RegExp;
            exclude: RegExp;
            use: {
                loader: string;
            }[];
            oneOf?: undefined;
        } | {
            oneOf: ({
                test: RegExp[];
                loader: string;
                options: {
                    limit: number;
                    name: string;
                };
                sideEffects?: undefined;
                use?: undefined;
                exclude?: undefined;
            } | {
                test: RegExp;
                sideEffects: boolean;
                use: (string | {
                    loader: string;
                    options: {
                        postcssOptions: {
                            plugins: string[];
                        };
                    };
                })[];
                loader?: undefined;
                options?: undefined;
                exclude?: undefined;
            } | {
                exclude: RegExp[];
                loader: string;
                options: {
                    name: string;
                    limit?: undefined;
                };
                test?: undefined;
                sideEffects?: undefined;
                use?: undefined;
            })[];
            test?: undefined;
            exclude?: undefined;
            use?: undefined;
        })[];
    };
    plugins: MiniCSSExtractPlugin[];
    resolve: {
        alias: {
            'payload-scss-overrides': string;
        };
        modules: string[];
    };
};
export default _default;
