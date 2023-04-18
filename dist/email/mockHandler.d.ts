import { EmailOptions } from '../config/types';
import { MockEmailHandler } from './types';
declare const mockEmailHandler: (emailConfig: EmailOptions) => Promise<MockEmailHandler>;
export default mockEmailHandler;
