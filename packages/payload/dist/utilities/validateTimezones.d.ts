import type { Timezone } from '../config/types.js';
type ValidateTimezonesArgs = {
    /**
     * The source of the timezones for error messaging
     */
    source?: string;
    /**
     * Array of timezones to validate
     */
    timezones: Timezone[] | undefined;
};
/**
 * Validates that all provided timezones are supported by the current runtime's Intl API.
 * Uses both Intl.DateTimeFormat and Intl.supportedValuesOf for comprehensive validation.
 *
 * @throws InvalidConfiguration if an unsupported timezone is found
 */
export declare const validateTimezones: ({ source, timezones }: ValidateTimezonesArgs) => void;
export {};
//# sourceMappingURL=validateTimezones.d.ts.map