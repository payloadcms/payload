import { execSync } from 'child_process';
import Conf from 'conf';
import { BinaryLike, createHash, randomBytes } from 'crypto';
import findUp from 'find-up';
import fs from 'fs';
import { Payload } from '../../index';
import { ServerInitEvent } from './events/serverInit';
import { AdminInitEvent } from './events/adminInit';

export type BaseEvent = {
  envID: string
  projectID: string
  nodeVersion: string
  nodeEnv: string
  payloadVersion: string
};

type TelemetryEvent = ServerInitEvent | AdminInitEvent

type Args = {
  payload: Payload
  event: TelemetryEvent
}
export const sendEvent = async ({ payload, event } : Args): Promise<void> => {
  if (payload.config.telemetry !== false) {
    try {
      const baseEvent: BaseEvent = {
        envID: getEnvID(),
        projectID: oneWayHash(getRawProjectID(), payload.secret),
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV || 'development',
        payloadVersion: await getPayloadVersionFromPackageJson(),
      };

      await fetch('https://telemetry.payloadcms.com/event', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...baseEvent, ...event }),
      });
    } catch (_) {
    // Eat any errors in sending telemetry event
    }
  }
};

/**
 * This is a quasi-persistent identifier used to dedupe recurring events. It's
 * generated from random data and completely anonymous.
 */
const getEnvID = (): string => {
  const conf = new Conf();
  const ENV_ID = 'envID';

  const val = conf.get(ENV_ID);
  if (val) {
    return val as string;
  }

  const generated = randomBytes(32).toString('hex');
  conf.set(ENV_ID, generated);
  return generated;
};

const getRawProjectID = (): string => {
  return getProjectIDByGit() || process.env.REPOSITORY_URL || process.cwd();
};


const getProjectIDByGit = () => {
  try {
    const originBuffer = execSync('git config --local --get remote.origin.url', {
      timeout: 1000,
      stdio: 'pipe',
    });

    return String(originBuffer).trim();
  } catch (_) {
    return null;
  }
};

type PackageJSON = { dependencies: Record<string, string | undefined> }
export const getPayloadVersionFromPackageJson = async (): Promise<string> => {
  const packageJsonPath = await findUp('package.json', { cwd: __dirname });
  const jsonContent: PackageJSON = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return jsonContent?.dependencies?.payload ?? '';
};

const oneWayHash = (data: BinaryLike, secret: string): string => {
  const hash = createHash('sha256');

  // prepend value with payload secret. This ensure one-way.
  hash.update(secret);

  // Update is an append operation, not a replacement. The secret from the prior
  // update is still present!
  hash.update(data);
  return hash.digest('hex');
};
