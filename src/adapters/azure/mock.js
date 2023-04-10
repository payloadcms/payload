exports.BlobServiceClient = {
  fromConnectionString: () => ({
    getContainerClient: () => ({
      createIfNotExists: () => null,
    }),
  }),
}

exports.AbortController = {
  timeout: () => null,
}

exports.Readable = { from: () => null }
