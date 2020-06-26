const getExecuteStaticPolicy = ({ config, Model }) => {
  return async (req, res, next) => {
    console.log('getting static file');
    // const policyResult = await executePolicy({ req, isReadingStaticFile: true }, config.policies.read);
    return next();
  };
};

module.exports = getExecuteStaticPolicy;
