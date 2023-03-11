exports.BlobServiceClient = {
  fromConnectionString: () => ({
    getContainerClient: () => ({
      createIfNotExists: () => null,
    }),
  }),
}
