import config from 'payload-config';
import sanitizeConfig from '../../utilities/sanitizeConfig';

const sanitizedConfig = sanitizeConfig(config);

export default sanitizedConfig;
