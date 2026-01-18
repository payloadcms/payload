import type { PropertiesHyphenFallback } from 'csstype';
import type { Prettify } from 'ts-essentials';
export type StyleObject = Prettify<{
    [K in keyof PropertiesHyphenFallback]?: Extract<PropertiesHyphenFallback[K], string> | undefined;
}>;
export type StateValues = {
    [stateValue: string]: {
        css: StyleObject;
        label: string;
    };
};
export type TextStateFeatureProps = {
    /**
     * The keys of the top-level object (stateKeys) represent the attributes that the textNode can have (e.g., color).
     * The values of the top-level object (stateValues) represent the values that the attribute can have (e.g., red, blue, etc.).
     * Within the stateValue, you can define inline styles and labels.
     *
     * @note Because this is a common use case, we provide a defaultColors object with colors that
     * look good in both dark and light mode, which you can use or adapt to your liking.
     *
     *
     *
     * @example
     * import { defaultColors } from '@payloadcms/richtext-lexical'
     *
     * state: {
     *   color: {
     *     ...defaultColors.background,
     *     ...defaultColors.text,
     *     // fancy gradients!
     *     galaxy: { label: 'Galaxy', css: { background: 'linear-gradient(to right, #0000ff, #ff0000)', color: 'white' } },
     *     sunset: { label: 'Sunset', css: { background: 'linear-gradient(to top, #ff5f6d, #6a3093)' } },
     *    },
     *    // You can have both colored and underlined text at the same time.
     *    // If you don't want that, you should group them within the same key.
     *    // (just like I did with defaultColors and my fancy gradients)
     *    underline: {
     *      'solid': { label: 'Solid', css: { 'text-decoration': 'underline', 'text-underline-offset': '4px' } },
     *      // You'll probably want to use the CSS light-dark() utility.
     *      'yellow-dashed': { label: 'Yellow Dashed', css: { 'text-decoration': 'underline dashed', 'text-decoration-color': 'light-dark(#EAB308,yellow)', 'text-underline-offset': '4px' } },
     *    },
     * }
     *
     */
    state: {
        [stateKey: string]: StateValues;
    };
};
/**
 * Allows you to store key-value attributes within TextNodes and define inline styles for each combination.
 * Inline styles are not part of the editorState, reducing the JSON size and allowing you to easily migrate or adapt styles later.
 *
 * This feature can be used, among other things, to add colors to text.
 *
 * For more information and examples, see the JSdocs for the "state" property that this feature receives as a parameter.
 *
 * @experimental There may be breaking changes to this API
 */
export declare const TextStateFeature: import("../typesServer.js").FeatureProviderProviderServer<TextStateFeatureProps, TextStateFeatureProps, TextStateFeatureProps>;
//# sourceMappingURL=feature.server.d.ts.map