import { Payload } from '../payload';
import { PayloadRequest } from '../express/types';
import { SanitizedConfig, EmailOptions } from '../config/types';
import { Collection } from '../collections/config/types';
import { User } from './types';
type Args = {
    config: SanitizedConfig;
    collection: Collection;
    user: User;
    disableEmail: boolean;
    req: PayloadRequest;
    token: string;
    sendEmail: Payload['sendEmail'];
    emailOptions: EmailOptions;
};
declare function sendVerificationEmail(args: Args): Promise<void>;
export default sendVerificationEmail;
