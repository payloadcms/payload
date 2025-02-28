// @ts-strict-ignore
import { isSafeFromPollution } from './utilities.js'

export const processNested = function (data) {
  if (!data || data.length < 1) {
    return Object.create(null)
  }

  const d = Object.create(null),
    keys = Object.keys(data)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i],
      keyParts = key.replace(new RegExp(/\[/g), '.').replace(new RegExp(/\]/g), '').split('.'),
      value = data[key]
    let current = d

    for (let index = 0; index < keyParts.length; index++) {
      const k = keyParts[index]

      // Ensure we don't allow prototype pollution
      if (!isSafeFromPollution(current, k)) {
        continue
      }

      if (index >= keyParts.length - 1) {
        current[k] = value
      } else {
        if (!current[k]) {
          current[k] = !keyParts[index + 1] ? [] : Object.create(null)
        }
        current = current[k]
      }
    }
  }
  return d
}
