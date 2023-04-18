import React from 'react';
import { SanitizedConfig } from '../../../../config/types';
export declare const ConfigProvider: React.FC<{
    config: SanitizedConfig;
    children: React.ReactNode;
}>;
export declare const useConfig: () => SanitizedConfig;
