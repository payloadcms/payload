export const recursiveAccessor = ({
  docRef,
  prefix = '',
  segment,
}: {
  docRef: Record<string, unknown> | unknown
  prefix?: string
  segment: string
}): { path: string; value: unknown } => {
  if (Array.isArray(docRef)) {
    docRef.forEach((item: Record<string, unknown>, i) => {
      Object.entries(item).forEach(([itemKey, itemValue]) => {
        recursiveAccessor({
          docRef: itemValue as Record<string, unknown>,
          prefix: `${prefix}_${i}_${itemKey}`,
          segment: itemKey,
        })
      })
    })
  } else if (typeof docRef === 'object') {
    Object.entries(docRef as Record<string, unknown>).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        recursiveAccessor({
          docRef: value as Record<string, unknown>,
          prefix: `${prefix}_${key}`,
          segment: key,
        })
      } else {
        return { path: `${prefix ? `${prefix}_` : ''}${key}`, value }
        // data[`${key}`] = value
      }
    })
  }
  return { path: `${prefix ? `${prefix}_` : ''}${segment}`, value: docRef }
}

// export const recursiveAccessor = ({
//   docRef,
//   prefix = '',
//   segment,
// }: {
//   docRef: Record<string, unknown> | unknown
//   prefix?: string
//   segment: string
// }): { path: string; value: unknown } => {
//   if (Array.isArray(docRef)) {
//     docRef.forEach((item: Record<string, unknown>, i) => {
//       Object.entries(item).forEach(([itemKey, itemValue]) => {
//         recursiveAccessor({
//           docRef: itemValue as Record<string, unknown>,
//           prefix: `${prefix}_${i}_${itemKey}`,
//           segment: itemKey,
//         })
//       })
//     })
//   } else if (typeof docRef === 'object') {
//     Object.entries(docRef as Record<string, unknown>).forEach(([key, value]) => {
//       if (value && typeof value === 'object') {
//         recursiveAccessor({
//           docRef: value as Record<string, unknown>,
//           prefix: `${prefix}_${key}`,
//           segment: key,
//         })
//       } else {
//         return { path: `${prefix ? `${prefix}_` : ''}${key}`, value }
//         // data[`${key}`] = value
//       }
//     })
//   }
//   return { path: `${prefix ? `${prefix}_` : ''}${segment}`, value: docRef }
// }

// const traverseFieldsCallback: TraverseFieldsCallback<Record<string, unknown>> = ({
//   field,
//   parentRef,
//   ref,
// }) => {
//   // always false because we are using flattenedFields but useful for type narrowing
//   if (!('name' in field)) {
//     return
//   }
//
//   if (field.type === 'group') {
//     selectRef = select[field.name] = {}
//     ref._name = field.name
//   }
//   const prefix =
//     typeof parentRef === 'object' && parentRef?._name && typeof parentRef._name === 'string'
//       ? `${parentRef._name}.`
//       : ''
//
//   // when fields aren't defined we assume all fields are included
//   if (
//     fields &&
//     'name' in field &&
//     !fields.some((f) => {
//       const segment = f.indexOf('.') > -1 ? f.substring(0, f.indexOf('.')) : f
//       return segment === `${prefix}${field.name}`
//     })
//   ) {
//     return
//   }
//
//   if (field.name) {
//     selectRef[field.name] = true
//   }
// }
