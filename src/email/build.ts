import nodemailer, { Transporter } from 'nodemailer';
import { PayloadEmailOptions } from '../types';
import { InvalidConfiguration } from '../errors';
import mockHandler from './mockHandler';
import Logger from '../utilities/logger';
const logger = Logger();

export default async function buildEmail(emailConfig: PayloadEmailOptions) {
  if (!emailConfig.transport || emailConfig.transport === 'mock') {
    const mockAccount = await mockHandler(emailConfig);
    // Only log mock credentials if was explicitly set in config
    if (emailConfig.transport === 'mock') {
      const { account: { web, user, pass } } = mockAccount;
      logger.info('E-mail configured with mock configuration');
      logger.info(`Log into mock email provider at ${web}`);
      logger.info(`Mock email account username: ${user}`);
      logger.info(`Mock email account password: ${pass}`);
    }
    return mockAccount;
  }

  const email = { ...emailConfig };

  if (!email.fromName || !email.fromAddress) {
    throw new InvalidConfiguration('Email fromName and fromAddress must be configured when transport is configured');
  }

  let transport: Transporter;
  // TODO: Is this ever populated when not using 'mock'?
  if (emailConfig.transport) {
    transport = emailConfig.transport;
  } else if (emailConfig.transportOptions) {
    transport = nodemailer.createTransport(emailConfig.transportOptions);
  }

  try {
    await transport.verify();
    email.transport = transport;
  } catch (err) {
    logger.error(
      "There is an error with the email configuration you have provided.",
      err
    );
  }

  return email;
}
