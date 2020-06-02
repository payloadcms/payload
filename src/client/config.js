import config from 'payload/unsanitizedConfig';
import sanitizeConfig from '../utilities/sanitizeConfig';

const sanitizedConfig = sanitizeConfig(config);

export default sanitizedConfig;
