const EVENT_VERSION = 'PAYLOAD_CLI_SESSION_STARTED';

type EventCliSessionStarted = {
  nodeVersion: string
  nodeEnv: string | null
}

export function eventPayloadInit(
  event: EventCliSessionStarted,
): { eventName: string; payload: EventCliSessionStarted }[] {
  const payload: EventCliSessionStarted = {
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV ?? null,
  };
  return [{ eventName: EVENT_VERSION, payload }];
}
