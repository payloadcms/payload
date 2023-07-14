import { InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { SanitizedConfig } from '../../../config/types';
import { getBaseConfig } from './base';

const mockModulePath = path.resolve(__dirname, '../../mocks/emptyModule.js');

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
        ...(baseConfig?.resolve?.alias || {}),
        vite: mockModulePath,
        '@vitejs/plugin-react': mockModulePath,
        express: mockModulePath,
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
