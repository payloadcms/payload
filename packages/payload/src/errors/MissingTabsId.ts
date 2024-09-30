import { APIError } from './APIError.js'

export class MissingTabsId extends APIError {
  constructor() {
    super(
      `Cannot set admin.condition for a Tab without assigning TabsField a unique 'id' property.`,
    )
  }
}
