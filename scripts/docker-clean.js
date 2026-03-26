import { execSync } from 'child_process'

try {
  execSync(
    'docker rm -f postgres-payload-test mongodb-payload-test mongot-payload-test mongodb-atlas-payload-test localstack_demo',
    { stdio: 'ignore' },
  )
} catch {
  // Some or all containers don't exist
}

try {
  execSync('docker compose -f test/docker-compose.yml --profile all down -v --remove-orphans', {
    stdio: 'inherit',
  })
} catch {}
