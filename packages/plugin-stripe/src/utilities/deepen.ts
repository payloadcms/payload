// converts an object of dot notation keys to a nested object
// i.e. { 'price.stripePriceID': '123' } to { price: { stripePriceID: '123' } }

export const deepen = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}

  for (const key in obj) {
    const value = obj[key]
    const keys = key.split('.')
    let current = result
    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = value
      } else {
        current[k] = current[k] || {}
        current = current[k]
      }
    })
  }
  return result
}
