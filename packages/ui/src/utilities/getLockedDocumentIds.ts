import { requests } from './api.js'

export const getLockedDocumentIds = async (serverURL: string, api: string): Promise<string[]> => {
  try {
    const response = await requests.get(`${serverURL}${api}/payload-locked-documents`)

    // Extract the IDs from the response
    const { docs } = await response.json()

    // Return an array of IDs for locked documents
    return docs.map((doc) => doc.document.value)
  } catch (error) {
    console.error('Failed to fetch locked document IDs', error)
    return []
  }
}
