/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database'

import type { ExampleAdapter } from '.'

/**
 * Perform any initialization actions here
 * This will run immediately when the db adapter is initialized and will take place before the connect method
 *
 * @returns {Promise<void>}
 */
export const init: Init = async function init(this: ExampleAdapter) {}
