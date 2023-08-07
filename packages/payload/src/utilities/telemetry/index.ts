import { execSync } from 'child_process';
import Conf from 'conf';
import { randomBytes } from 'crypto';
import findUp from 'find-up';
import fs from 'fs';
import { Payload } from '../../payload';
import { ServerInitEvent } from './events/serverInit';
import { AdminInitEvent } from './events/adminInit';
import { oneWayHash } from './oneWayHash';

export type BaseEvent = {
  envID: string
  projectID: string
  nodeVersion: string
  nodeEnv: string
  payloadVersion: string
};

type PackageJSON = {
  name: string
  dependencies: Record<string, string | undefined>
}

type TelemetryEvent = ServerInitEvent | AdminInitEvent

type Args = {
  payload: Payload
  event: TelemetryEvent
}

export const sendEvent = async ({ payload, event }: Args): Promise<void> => {
  if (payload.config.telemetry !== false) {
    try {
      const packageJSON = await getPackageJSON();

      const baseEvent: BaseEvent = {
        envID: getEnvID(),
        projectID: getProjectID(payload, packageJSON),
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV || 'development',
        payloadVersion: getPayloadVersion(packageJSON),
      };

      await fetch('https://telemetry.payloadcms.com/events', {
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

const getProjectID = (payload: Payload, packageJSON: PackageJSON): string => {
  const projectID = getGitID(payload) || getPackageJSONID(payload, packageJSON) || payload.config.serverURL || process.cwd();
  return oneWayHash(projectID, payload.secret);
};

const getGitID = (payload: Payload) => {
  try {
    const originBuffer = execSync('git config --local --get remote.origin.url', {
      timeout: 1000,
      stdio: 'pipe',
    });

    return oneWayHash(String(originBuffer).trim(), payload.secret);
  } catch (_) {
    return null;
  }
};

const getPackageJSON = async (): Promise<PackageJSON> => {
  const packageJsonPath = await findUp('package.json', { cwd: __dirname });
  const jsonContent: PackageJSON = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return jsonContent;
};

const getPackageJSONID = (payload: Payload, packageJSON: PackageJSON): string => {
  return oneWayHash(packageJSON.name, payload.secret);
};

export const getPayloadVersion = (packageJSON: PackageJSON): string => {
  return packageJSON?.dependencies?.payload ?? '';
};
