import type { Bucket } from '@google-cloud/storage'
import { readFile } from 'fs/promises'
import path from 'path'

interface ServerConfig {
  bucketName: string
  projectId?: string
  keyFilename?: string
  payloadApiUrl?: string
  payloadApiKey?: string
}

export function registerAssetTools(bucket: Bucket, config: ServerConfig) {
  return {
    upload_asset: async (args: any) => {
      try {
        const { file_path, collection = 'media', alt } = args

        // Read file
        const fileBuffer = await readFile(file_path)
        const filename = path.basename(file_path)

        // Upload to Payload via API
        const formData = new FormData()
        formData.append('file', new Blob([fileBuffer]), filename)
        if (alt) formData.append('alt', alt)

        const headers: any = {
          Accept: 'application/json',
        }
        if (config.payloadApiKey) {
          headers['Authorization'] = `Bearer ${config.payloadApiKey}`
        }

        const response = await fetch(`${config.payloadApiUrl}/api/${collection}`, {
          method: 'POST',
          headers,
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const result = await response.json()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  asset: result.doc,
                  message: `Asset uploaded successfully: ${filename}`,
                },
                null,
                2,
              ),
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },

    list_assets: async (args: any) => {
      try {
        const { collection = 'media', limit = 10, page = 1 } = args

        const headers: any = {
          Accept: 'application/json',
        }
        if (config.payloadApiKey) {
          headers['Authorization'] = `Bearer ${config.payloadApiKey}`
        }

        const url = new URL(`${config.payloadApiUrl}/api/${collection}`)
        url.searchParams.set('limit', limit.toString())
        url.searchParams.set('page', page.toString())

        const response = await fetch(url.toString(), { headers })

        if (!response.ok) {
          throw new Error(`Failed to list assets: ${response.statusText}`)
        }

        const result = await response.json()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  assets: result.docs,
                  totalDocs: result.totalDocs,
                  page: result.page,
                  totalPages: result.totalPages,
                },
                null,
                2,
              ),
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },

    get_asset: async (args: any) => {
      try {
        const { id, collection = 'media' } = args

        const headers: any = {
          Accept: 'application/json',
        }
        if (config.payloadApiKey) {
          headers['Authorization'] = `Bearer ${config.payloadApiKey}`
        }

        const response = await fetch(`${config.payloadApiUrl}/api/${collection}/${id}`, {
          headers,
        })

        if (!response.ok) {
          throw new Error(`Failed to get asset: ${response.statusText}`)
        }

        const result = await response.json()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  asset: result,
                },
                null,
                2,
              ),
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },

    delete_asset: async (args: any) => {
      try {
        const { id, collection = 'media' } = args

        const headers: any = {
          Accept: 'application/json',
        }
        if (config.payloadApiKey) {
          headers['Authorization'] = `Bearer ${config.payloadApiKey}`
        }

        const response = await fetch(`${config.payloadApiUrl}/api/${collection}/${id}`, {
          method: 'DELETE',
          headers,
        })

        if (!response.ok) {
          throw new Error(`Failed to delete asset: ${response.statusText}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Asset ${id} deleted successfully`,
              }),
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },

    update_asset: async (args: any) => {
      try {
        const { id, collection = 'media', ...updateData } = args

        const headers: any = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
        if (config.payloadApiKey) {
          headers['Authorization'] = `Bearer ${config.payloadApiKey}`
        }

        const response = await fetch(`${config.payloadApiUrl}/api/${collection}/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          throw new Error(`Failed to update asset: ${response.statusText}`)
        }

        const result = await response.json()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  asset: result.doc,
                  message: 'Asset updated successfully',
                },
                null,
                2,
              ),
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },

    search_assets: async (args: any) => {
      try {
        const { query, collection = 'media' } = args

        const headers: any = {
          Accept: 'application/json',
        }
        if (config.payloadApiKey) {
          headers['Authorization'] = `Bearer ${config.payloadApiKey}`
        }

        const url = new URL(`${config.payloadApiUrl}/api/${collection}`)
        url.searchParams.set('where[filename][contains]', query)

        const response = await fetch(url.toString(), { headers })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const result = await response.json()

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  results: result.docs,
                  totalResults: result.totalDocs,
                },
                null,
                2,
              ),
            },
          ],
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },

    get_asset_url: async (args: any) => {
      try {
        const { filename, signed = false, expiresIn = 60 } = args

        const file = bucket.file(filename)

        if (signed) {
          const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresIn * 60 * 1000,
          })

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  url,
                  signed: true,
                  expiresIn: `${expiresIn} minutes`,
                }),
              },
            ],
          }
        } else {
          const url = `https://storage.googleapis.com/${config.bucketName}/${filename}`

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  url,
                  signed: false,
                }),
              },
            ],
          }
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        }
      }
    },
  }
}
