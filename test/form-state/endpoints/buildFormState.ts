import type { Endpoint } from 'payload'

/**
 * This endpoint is used to test the `buildFormState` function within int tests and asserting the results.
 * We cannot invoke the `buildFormState` function directly int tests because it needs to render React components.
 * Jest does not support rendering RSCs currently, so we need to create an endpoint to test it.
 * Hitting the form-state Server Function within e2e tests is also not testable because:
 *   - It is flaky, i.e. Chrome will sometimes omit the response body for `text/x-component` responses.
 *   - It is difficult to parse `text/x-component` responses as they are not JSON.
 * Instead, we create a custom endpoint that will call the `buildFormState` function on our behalf.
 * This function will automatically omit any JSX elements that are not serializable.
 */
export const buildFormStateEndpoint: Endpoint = () => {}
