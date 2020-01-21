const schemaBaseFields = {
  // TODO: What is status being used for? It is probable that people are going to try to add their own status field for their own purposes. Is there a safe way we can house payload level fields in the future to avoid collisions?
  status: String,
  publishedAt: Date,
};

module.exports = schemaBaseFields;
