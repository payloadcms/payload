import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from 'pino';
import { EmailOptions, EmailTransport, hasTransport, hasTransportOptions } from '../config/types';
import { InvalidConfiguration } from '../errors';
import mockHandler from './mockHandler';
import { BuildEmailResult, MockEmailHandler } from './types';

async function handleTransport(transport: Transporter, email: EmailTransport, logger: Logger): BuildEmailResult {
  try {
    await transport.verify();
  } catch (err) {
    logger.error(
      `There is an error with the email configuration you have provided. ${err}`,
    );
  }

  return { ...email, transport };
}

const ensureConfigHasFrom = (emailConfig: EmailOptions) => {
  if (!emailConfig?.fromName || !emailConfig?.fromAddress) {
    throw new InvalidConfiguration('Email fromName and fromAddress must be configured when transport is configured');
  }
};

const handleMockAccount = async (emailConfig: EmailOptions, logger: Logger) => {
  let mockAccount: MockEmailHandler;
  try {
    mockAccount = await mockHandler(emailConfig);
    const { account: { web, user, pass } } = mockAccount;
    if (emailConfig?.logMockCredentials) {
      logger.info('E-mail configured with mock configuration');
      logger.info(`Log into mock email provider at ${web}`);
      logger.info(`Mock email account username: ${user}`);
      logger.info(`Mock email account password: ${pass}`);
    }
  } catch (err) {
    logger.error({ msg: 'There was a problem setting up the mock email handler', err });
  }
  return mockAccount;
};

export default async function buildEmail(emailConfig: EmailOptions | undefined, logger: Logger): BuildEmailResult {
  if (!emailConfig) {
    return handleMockAccount(emailConfig, logger);
  }

  if (hasTransport(emailConfig) && emailConfig.transport) {
    ensureConfigHasFrom(emailConfig);
    const email = { ...emailConfig };
    const { transport } : {transport: Transporter} = emailConfig;
    return handleTransport(transport, email, logger);
  }

  if (hasTransportOptions(emailConfig) && emailConfig.transportOptions) {
    ensureConfigHasFrom(emailConfig);
    const email = { ...emailConfig } as EmailTransport;
    const transport = nodemailer.createTransport(emailConfig.transportOptions);
    return handleTransport(transport, email, logger);
  }

  return handleMockAccount(emailConfig, logger);
}
