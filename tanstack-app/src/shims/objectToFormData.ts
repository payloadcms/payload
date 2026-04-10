// @ts-expect-error Vite creates this optimized module at runtime.
import objectToFormDataModule from '/node_modules/.vite/deps/@payloadcms_ui___object-to-formdata.js'

export const { serialize } = objectToFormDataModule
export default objectToFormDataModule
