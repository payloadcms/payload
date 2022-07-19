import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { AdminUrlUtil } from '../helpers/adminUrlUtil';
import { initPayloadTest } from '../helpers/configHelpers';
import { firstRegister } from '../helpers';
import { slug } from './config';

/**
 * TODO: Auth
 * change password
 * unlock
 * generate api key
 * log out
 */

const { beforeAll, describe } = test;
let url: AdminUrlUtil;
