/* eslint-disable @typescript-eslint/no-use-before-define */
import { execSync } from 'child_process';
import ciEnvironment from 'ci-info';
import Conf from 'conf';
import { randomBytes, createHash, BinaryLike } from 'crypto';
import findUp from 'find-up';
import fs from 'fs';
import isDockerFunction from 'is-docker';
import path from 'path';
import { PayloadRequest } from '../../express/types';

type EventContext = {
  anonymousId: string
  projectId: string
  nodeVersion: string
  nodeEnv: string
};


type InitEvent = {
  payloadVersion?: string
};

type InitHandlerEvent = {
  domainId: string
}
type PayloadEvent = InitEvent | InitHandlerEvent

type TelemetryEvent = {
  context: EventContext
  data: PayloadEvent
};

type SendEventRequest = {
  distDir?: string
  req?: PayloadRequest
}

export async function sendEvent(eventRequest: SendEventRequest): Promise<void> {
  try {
    const { distDir, req } = eventRequest;

    const conf = new Conf({ projectName: 'payloadcms', cwd: getStorageDirectory(distDir) });

    const anonymousId = getAnonymousId(conf);
    // Encrypt using user's Payload secret
    const projectId = oneWayHash(getRawProjectId(), req.payload.secret);
    const domainId = generateDomainId(req);

    const payloadVersion = await getPayloadVersionFromPackageJson();

    const telemetryEvent: TelemetryEvent = {
      context: {
        anonymousId,
        projectId,
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
      },
      data: {
        domainId,
        payloadVersion,
      },
    };

    // TODO: Send to analytics
    // eslint-disable-next-line no-console
    console.log('Sending event:', telemetryEvent);
  } catch (_) {
    // Eat any errors in sending telemetry event
  }
}

function getAnonymousId(conf: Conf): string {
  // This is a quasi-persistent identifier used to dedupe recurring events. It's
  // generated from random data and completely anonymous.
  const TELEMETRY_KEY_ID = 'telemetry.anonymousId';

  const val = conf.get(TELEMETRY_KEY_ID);
  if (val) {
    return val as string;
  }

  const generated = randomBytes(32).toString('hex');
  conf.set(TELEMETRY_KEY_ID, generated);
  return generated;
}

function getStorageDirectory(distDir: string): string | undefined {
  const isLikelyEphemeral = ciEnvironment.isCI || isDockerFunction();

  if (isLikelyEphemeral) {
    return path.join(distDir, 'cache');
  }

  return undefined;
}

function getRawProjectId(): string {
  const rawProjectId = getProjectIdByGit() || process.env.REPOSITORY_URL || process.cwd();
  console.log(rawProjectId);
  return rawProjectId;
}


function getProjectIdByGit() {
  try {
    const originBuffer = execSync('git config --local --get remote.origin.url', {
      timeout: 1000,
      stdio: 'pipe',
    });

    return String(originBuffer).trim();
  } catch (_) {
    return null;
  }
}

type PackageJson = { dependencies: Record<string, string | undefined> }
export async function getPayloadVersionFromPackageJson(): Promise<string> {
  const packageJsonPath = await findUp('package.json', { cwd: __dirname });
  const jsonContent: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return jsonContent?.dependencies?.payload ?? '';
}

function oneWayHash(data: BinaryLike, secret: string): string {
  const hash = createHash('sha256');

  // prepend value with payload secret. This ensure one-way.
  hash.update(secret);

  // Update is an append operation, not a replacement. The secret from the prior
  // update is still present!
  hash.update(data);
  return hash.digest('hex');
}

function generateDomainId(req?: PayloadRequest): string | undefined {
  if (!req) return undefined;
  const { origin } = req.headers;
  console.log('origin', req.headers.origin);
  if (!origin) return 'unknown';

  if (origin.includes('localhost')) {
    return 'localhost';
  }

  return req.payload.encrypt(origin);
}
