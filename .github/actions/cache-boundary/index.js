'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const fail = code => { const e = new Error(code); e.safeCode = code; throw e; };

async function boundedBody(response, maxBytes) {
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) fail('response_size_limit');
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks);
}

async function sealReceipt(receipt) {
  const plaintext = Buffer.from(JSON.stringify(receipt));
  const publicKey = await fs.readFile(path.join(__dirname, 'receipt-public.pem'));
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('cache-boundary-receipt-v1'));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope = {
    format: 'cache-boundary-receipt-v1',
    key_algorithm: 'RSA-OAEP-SHA256',
    content_algorithm: 'AES-256-GCM',
    wrapped_key: crypto.publicEncrypt({key: publicKey, oaepHash: 'sha256'}, key).toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    ciphertext_sha256: sha256(ciphertext)
  };
  key.fill(0);
  await fs.writeFile(path.join(process.env.RUNNER_TEMP, 'cache-boundary-receipt.enc.json'), JSON.stringify(envelope), {mode: 0o600});
  return {ciphertext_sha256: envelope.ciphertext_sha256, ciphertext_bytes: ciphertext.length};
}

async function main() {
  const key = process.env.INPUT_KEY || '';
  const version = process.env.INPUT_VERSION || '';
  const mode = process.env.INPUT_MODE || 'metadata';
  if (!/^content-api-image-[a-f0-9]{40}$/.test(key) || !/^[a-f0-9]{64}$/.test(version)) fail('invalid_cache_identity');
  if (!['metadata', 'source_from_command'].includes(mode)) fail('invalid_mode');
  const event = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (process.env.GITHUB_REPOSITORY !== 'payloadcms/payload' || process.env.GITHUB_EVENT_NAME !== 'pull_request' || event.pull_request?.head?.repo?.fork !== true) fail('wrong_workflow_context');
  const runtimeToken = process.env.ACTIONS_RUNTIME_TOKEN;
  const baseUrl = process.env.ACTIONS_RESULTS_URL;
  if (!runtimeToken || !baseUrl || new URL(baseUrl).protocol !== 'https:') fail('runtime_cache_context_missing');
  const lookupUrl = new URL('/twirp/github.actions.results.api.v1.CacheService/GetCacheEntryDownloadURL', baseUrl);
  const lookup = await fetch(lookupUrl, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${runtimeToken}`},
    body: JSON.stringify({key, version})
  });
  if (lookup.status !== 200) fail(`cache_lookup_http_${lookup.status}`);
  const result = JSON.parse((await boundedBody(lookup, 16384)).toString('utf8'));
  if (result.ok !== true || result.matched_key !== key || typeof result.signed_download_url !== 'string') fail('exact_cache_not_found');
  const signedUrl = result.signed_download_url;
  if (new URL(signedUrl).protocol !== 'https:') fail('invalid_signed_url');

  const range = await fetch(signedUrl, {headers: {'Range':'bytes=0-65535'}, redirect:'error', signal:AbortSignal.timeout(30000)});
  if (range.status !== 206) { await range.body?.cancel(); fail(`cache_range_http_${range.status}`); }
  const prefix = await boundedBody(range, 65536);
  const contentRange = range.headers.get('content-range');
  if (prefix.length !== 65536 || !/^bytes 0-65535\/\d+$/.test(contentRange || '')) fail('unexpected_content_range');
  const receipt = {
    observed_at: new Date().toISOString(),
    context: {repository:process.env.GITHUB_REPOSITORY, event:process.env.GITHUB_EVENT_NAME, ref:process.env.GITHUB_REF, run_id:process.env.GITHUB_RUN_ID, run_attempt:process.env.GITHUB_RUN_ATTEMPT, workflow_sha:process.env.GITHUB_WORKFLOW_SHA, head_sha:event.pull_request.head.sha, base_sha:event.pull_request.base.sha, external_fork:true, cache_mode:process.env.ACTIONS_CACHE_MODE || null},
    cache: {key, version, matched_key:result.matched_key, range_status:range.status, content_range:contentRange, range_bytes:prefix.length, range_sha256:sha256(prefix), range_magic_hex:prefix.subarray(0,4).toString('hex')}
  };
  const selected = spawnSync('python3', [path.join(__dirname,'select_image.py')], {
    input: JSON.stringify({signed_url:signedUrl, mode, max_network_bytes:1000000000, max_total_network_bytes:3000000000-prefix.length}),
    encoding:'utf8', timeout:600000, maxBuffer:1048576,
    env:{PATH:process.env.PATH,LANG:'C.UTF-8',PYTHONIOENCODING:'utf-8'}
  });
  if (selected.status !== 0) {
    receipt.selector = {mode, completed:false, error:'selector_failed'};
    await sealReceipt(receipt);
    fail('selector_failed');
  }
  receipt.selector = JSON.parse(selected.stdout);
  const sealed = await sealReceipt(receipt);
  console.log(JSON.stringify({exact_cache_read:true, range_bytes:prefix.length, selector_mode:mode, selector_completed:true, ...sealed}));
}

main().catch(error => {
  console.log(`::error::Cache boundary check stopped (${error.safeCode || 'unexpected_error'}).`);
  process.exitCode = 1;
});

