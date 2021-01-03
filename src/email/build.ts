import nodemailer, { Transporter } from 'nodemailer';
import { EmailOptions, EmailTransport, hasTransport, hasTransportOptions } from '../config/types';
import { InvalidConfiguration } from '../errors';
import mockHandler from './mockHandler';
import Logger from '../utilities/logger';
import { BuildEmailResult } from './types';

const logger = Logger();

async function handleTransport(transport: Transporter, email: EmailTransport): BuildEmailResult {
  try {
    await transport.verify();
  } catch (err) {
    logger.error(
      'There is an error with the email configuration you have provided.',
      err,
    );
  }

  return { ...email, transport };
}

export default async function buildEmail(emailConfig: EmailOptions): BuildEmailResult {

  if (!emailConfig.fromName || !emailConfig.fromAddress) {
    throw new InvalidConfiguration('Email fromName and fromAddress must be configured when transport is configured');
  }

  if (hasTransport(emailConfig) && emailConfig.transport) {
    const email = { ...emailConfig };
    const { transport } : {transport: Transporter} = emailConfig;
    return handleTransport(transport, email);
  }

  if (hasTransportOptions(emailConfig) && emailConfig.transportOptions) {
    const email = { ...emailConfig } as EmailTransport;
    const transport = nodemailer.createTransport(emailConfig.transportOptions);
    return handleTransport(transport, email);
  }

  const mockAccount = await mockHandler(emailConfig);
  // Only log mock credentials if was explicitly set in config
  const { account: { web, user, pass } } = mockAccount;
  logger.info('E-mail configured with mock configuration');
  logger.info(`Log into mock email provider at ${web}`);
  logger.info(`Mock email account username: ${user}`);
  logger.info(`Mock email account password: ${pass}`);
  return mockAccount;
}
