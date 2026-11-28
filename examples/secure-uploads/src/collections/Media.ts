import type { CollectionConfig } from 'payload'
import { scanBytes } from 'pompelmi'
import { APIError } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    beforeOperation: [
      async ({ operation, req }) => {
        // Only scan files during create and update operations
        if ((operation === 'create' || operation === 'update') && req.file?.data) {
          try {
            // Scan the uploaded file buffer using Pompelmi
            const result = await scanBytes(req.file.data)

            // Check if the scan detected any threats
            // Verdict can be 'clean', 'suspicious', or 'malicious'
            if (result.verdict !== 'clean') {
              // Throw an error if malware or threats are detected
              const threatDetails = result.reasons?.join(', ') || result.verdict
              throw new APIError(
                `Security Check Failed: ${threatDetails}. File upload rejected.`,
                400, // Bad Request status code
                {
                  verdict: result.verdict,
                  matches: result.matches,
                  fileName: req.file.name,
                },
              )
            }

            // Log successful scans for monitoring
            req.payload.logger.info({
              msg: 'File security scan passed',
              fileName: req.file.name,
              fileSize: req.file.size,
              verdict: result.verdict,
            })
          } catch (error) {
            // Re-throw APIError as-is
            if (error instanceof APIError) {
              throw error
            }

            // Wrap other errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            req.payload.logger.error({
              msg: 'Error during file security scan',
              error: errorMessage,
              fileName: req.file.name,
            })

            throw new APIError('File security scan failed. Please try again.', 500, {
              originalError: errorMessage,
            })
          }
        }
      },
    ],
  },
  upload: {
    staticDir: './media',
  },
}
