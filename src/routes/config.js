const passport = require('passport');

const registerConfigRoute = ({ router, config }, getCollections, getGlobals) => {
  router.use('/config',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      const registeredCollections = getCollections();
      const globals = getGlobals();

      const collections = {};
      const contentBlocks = {};
      Object.keys(registeredCollections).forEach((key) => {
        const fullConfig = registeredCollections[key].config;

        const collectionConfig = { ...fullConfig };

        delete collectionConfig.plugins;
        delete collectionConfig.policies;

        if (collectionConfig.useAsContentBlock) {
          contentBlocks[collectionConfig.slug] = collectionConfig;
        }

        collections[collectionConfig.slug] = collectionConfig;
      });
      res.json({
        ...config,
        collections,
        globals,
        contentBlocks,
      });
    });
};

module.exports = registerConfigRoute;
