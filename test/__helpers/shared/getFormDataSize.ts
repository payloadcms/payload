export function getFormDataSize(formData: FormData) {
  const blob = new Blob(formDataToArray(formData))
  return blob.size
}

function formDataToArray(formData: FormData) {
  const parts = []
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      parts.push(value)
    } else {
      parts.push(new Blob([value], { type: 'text/plain' }))
    }
  }
  return parts
}
