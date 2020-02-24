import config from 'payload-config';

const getSanitizedConfig = () => {
  const sanitizedConfig = { ...config };

  sanitizedConfig.routes = {
    admin: (config.routes && config.routes.admin) ? config.routes.admin : '/admin',
    api: (config.routes && config.routes.api) ? config.routes.api : '/api',
  };

  return sanitizedConfig;
};

export default getSanitizedConfig;
