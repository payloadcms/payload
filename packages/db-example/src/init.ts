/* eslint-disable no-param-reassign */
import type { Init } from 'payload/database'

import type { ExampleAdapter } from '.'

/**
 * Perform any initialization actions here.
 * This will run immediately when the DB adapter is initialized and will take place before the connect method.
 * If your implementation needs models created from Payload collections and globals, you would do this here.
 * If your implementation needs to maintain a persistent connection, you should call this.connect here.
 *
 * Your DB adapter needs to be able to handle all the different Payload field types found in collections & globals:
 *
 * - Fields containing subfields:
 *   - 'array'
 *   - 'blocks'
 *   - 'collapsible'
 *   - 'group'
 *   - 'row'
 *   - 'tabs'
 *
 * - Other fields:
 *   - 'checkbox'
 *   - 'code'
 *   - 'date'
 *   - 'email'
 *   - 'json'
 *   - 'number'
 *   - 'point'
 *   - 'radio'
 *   - 'relationship'
 *   - 'richText'
 *   - 'select'
 *   - 'text'
 *   - 'textarea'
 *   - 'upload'
 *
 * @returns {Promise<void>}
 */
export const init: Init = async function init(this: ExampleAdapter) {}
