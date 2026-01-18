import type { ImageSize } from '../types.js';
/**
 * Sanitize the resize config. If the resize config has the `withoutReduction`
 * property set to true, the `fit` and `position` properties will be set to `contain`
 * and `top left` respectively.
 *
 * @param resizeConfig - the resize config
 * @returns a sanitized resize config
 */
export declare const sanitizeResizeConfig: (resizeConfig: ImageSize) => ImageSize;
//# sourceMappingURL=sanitizeResizeConfig.d.ts.map