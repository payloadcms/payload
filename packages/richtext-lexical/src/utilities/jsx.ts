// Example input: type="info" hello={{heyyy: 'test', someNumber: 2}}
export function extractPropsFromJSXPropsString({ propsString }: { propsString: string }) {
  const props = {}

  // Parse simple key-value pairs
  const simplePropsRegex = /(\w+)="([^"]*)"/g
  let match
  while ((match = simplePropsRegex.exec(propsString)) !== null) {
    const [, key, value] = match
    props[key] = value
  }

  // Parse complex JSON-like props
  const complexPropsRegex = /(\w+)=\{\{(.*?)\}\}/g
  while ((match = complexPropsRegex.exec(propsString)) !== null) {
    const [, key, value] = match
    try {
      props[key] = JSON.parse(`{${value}}`)
    } catch (error) {
      console.error(`Error parsing complex prop ${key}:`, error)
    }
  }

  return props
}
