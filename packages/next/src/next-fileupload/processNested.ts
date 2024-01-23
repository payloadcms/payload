import { isSafeFromPollution } from './utilities'

export const processNested = function (data) {
  if (!data || data.length < 1) return Object.create(null)

  let d = Object.create(null),
    keys = Object.keys(data)

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i],
      value = data[key],
      current = d,
      keyParts = key.replace(new RegExp(/\[/g), '.').replace(new RegExp(/\]/g), '').split('.')

    for (let index = 0; index < keyParts.length; index++) {
      let k = keyParts[index]

      // Ensure we don't allow prototype pollution
      if (!isSafeFromPollution(current, k)) {
        continue
      }

      if (index >= keyParts.length - 1) {
        current[k] = value
      } else {
        if (!current[k]) current[k] = !keyParts[index + 1] ? [] : Object.create(null)
        current = current[k]
      }
    }
  }
  return d
}
