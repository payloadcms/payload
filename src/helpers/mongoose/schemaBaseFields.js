const schemaBaseFields = {
  status: String,
  publishedAt: Date
};

const userBaseFields = {
  resetPasswordToken: String,
  resetPasswordExpiration: Date
};

export { schemaBaseFields, userBaseFields }
