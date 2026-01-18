import type { ImageSize, ProbedImageSize } from '../types.js';
/**
 * Determine whether or not to resize the image.
 * - resize using image config
 * - resize using image config with focal adjustments
 * - do not resize at all
 *
 * `imageResizeConfig.withoutEnlargement`:
 * - undefined [default]: uploading images with smaller width AND height than the image size will return null
 * - false: always enlarge images to the image size
 * - true: if the image is smaller than the image size, return the original image
 *
 * `imageResizeConfig.withoutReduction`:
 * - false [default]: always enlarge images to the image size
 * - true: if the image is smaller than the image size, return the original image
 *
 * @return 'omit' | 'resize' | 'resizeWithFocalPoint'
 */
export declare const getImageResizeAction: ({ dimensions: originalImage, hasFocalPoint, imageResizeConfig, }: {
    dimensions: ProbedImageSize;
    hasFocalPoint?: boolean;
    imageResizeConfig: ImageSize;
}) => "omit" | "resize" | "resizeWithFocalPoint";
//# sourceMappingURL=getImageResizeAction.d.ts.map