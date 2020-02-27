import config from 'payload-config';
import sanitizeConfig from '../../utilities/sanitizeConfig';

const getSanitizedClientConfig = () => sanitizeConfig(config);
export default getSanitizedClientConfig;
