import fs from 'fs';
import path from 'path';
import { getPayloadVersionFromPackageJson, sendEvent } from './telemetry';

describe('Telemetry', () => {
  const mockPackageJsonPath = path.join(__dirname, 'package.json');
  const mockPaylodVersion = '0.18.0';
  beforeAll(() => {
    fs.writeFileSync(mockPackageJsonPath, JSON.stringify({ dependencies: { payload: mockPaylodVersion } }));
  });

  afterAll(() => {
    fs.rmSync(mockPackageJsonPath);
  });

  it('should work', async () => {
    const payloadVersion = await getPayloadVersionFromPackageJson();
    expect(payloadVersion).toStrictEqual(mockPaylodVersion);
  });

  it('should send event', async () => {
    await sendEvent({ distDir: 'dist' });
  });
});
