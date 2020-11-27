import { Express } from 'express';
import joi from 'joi';
import 'joi-extract-type';
import { DeepRequired } from 'ts-essentials';
import { Transporter } from 'nodemailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import { GraphQLType } from 'graphql';
import schema from './schema';

import InitializeGraphQL from '../graphql';

type MockEmailTransport = {
  transport?: 'mock';
  fromName?: string;
  fromAddress?: string;
};

type ValidEmailTransport = {
  transport: Transporter;
  transportOptions?: SMTPConnection.Options;
  fromName: string;
  fromAddress: string;
};

export type EmailOptions = ValidEmailTransport | MockEmailTransport;

export type InitOptions = {
  express?: Express;
  mongoURL: string;
  secret: string;
  license?: string;
  email?: EmailOptions;
  local?: boolean;
  onInit?: () => void;
};

export type SendEmailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type MockEmailCredentials = {
  user: string;
  pass: string;
  web: string;
};

export type Access = (args?: any) => boolean;

// Create type out of Joi schema
// Extend the type with a bit more specificity

export type PayloadConfig = joi.extractType<typeof schema> & {
  graphQL: {
    mutations: {
      [key: string]: unknown
    } | ((graphQL: GraphQLType, payload: InitializeGraphQL) => any),
    queries: {
      [key: string]: unknown
    } | ((graphQL: GraphQLType, payload: InitializeGraphQL) => any),
    maxComplexity: number;
    disablePlaygroundInProduction: boolean;
  },
  email: EmailOptions,
};

export type Config = DeepRequired<PayloadConfig>
