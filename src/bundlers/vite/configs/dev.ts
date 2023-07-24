import { InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { SanitizedConfig } from '../../../config/types';
import { getBaseConfig } from './base';

const mockModulePath = path.resolve(__dirname, '../../mocks/all.js');

export const getDevConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  const baseConfig = getBaseConfig(payloadConfig);

  const viteConfig: InlineConfig = {
    ...baseConfig,
    server: {
      middlewareMode: true,
    },
    plugins: [
      ...(baseConfig?.plugins || []),
      typeof react === 'function' && react(),
    ],
    resolve: {
      ...(baseConfig?.resolve || {}),
      alias: {
        '@rollup/plugin-commonjs': mockModulePath,
        '@rollup/plugin-image': mockModulePath,
        '@vitejs/plugin-react': mockModulePath,
        'html-webpack-plugin': mockModulePath,
        'mini-css-extract-plugin': mockModulePath,
        'rollup-plugin-scss': mockModulePath,
        'swc-minify-webpack-plugin': mockModulePath,
        'webpack-bundle-analyzer': mockModulePath,
        express: mockModulePath,
        vite: mockModulePath,
        webpack: mockModulePath,
        ...(baseConfig?.resolve?.alias || {}),
      },
    },
    define: {
      ...(baseConfig?.define || {}),
      __dirname: '""',
      'module.hot': 'undefined',
      process: '({argv:[],env:{},cwd:()=>""})',
    },
  };

  return viteConfig;
};
