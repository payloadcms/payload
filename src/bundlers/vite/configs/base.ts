import path from 'path';
import { InlineConfig } from 'vite';
import commonJS from 'vite-plugin-commonjs';
import type { SanitizedConfig } from '../../../config/types';

const bundlerPath = path.resolve(__dirname, '../bundler');
export const getBaseConfig = (payloadConfig: SanitizedConfig): InlineConfig => {
  return {
    root: path.resolve(__dirname, '../../../admin'),
    // Bug with base path: https://github.com/vitejs/vite/pull/13712
    base: payloadConfig.routes.admin,
    plugins: [
      {
        name: 'replace-bundler-path',
        transform(code, id) {
          if (id.startsWith(bundlerPath)) {
            return 'export default () => { };';
          }
          return code;
        },
      },
      commonJS(),
    ],
    resolve: {
      alias: {
        // Alternative is to remove ~ from the import
        '~payload-user-css': payloadConfig.admin.css,
        '~react-toastify': 'react-toastify',
      },
    },
  };
};
