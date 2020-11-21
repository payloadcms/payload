import { TestAccount, Transporter } from 'nodemailer';

export type MockEmailHandler = { account: TestAccount; transport: Transporter };
