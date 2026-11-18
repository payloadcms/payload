# Recording jobs

Use the job API when an agent starts a recording. It supervises the whole candidate command, including validation, capture, and conversion, independently of the prompt. It currently supports macOS and Linux.

```sh
node .agents/skills/record-pr-demo/scripts/recording-job.mjs start \
  --scenario /tmp/demo.mjs --label feature-take-1
```

The JSON result contains a job ID, output path, and log path. Artifacts live in a private temporary job directory. Inspect the returned log for progress.

While the prompt is active, call `renew` about every 20 seconds. Each explicit renewal extends the lease by 60 seconds. Never put renewals in a background loop or inside the recording script: they must stop when the agent stops working.

```sh
node .agents/skills/record-pr-demo/scripts/recording-job.mjs renew JOB_ID
node .agents/skills/record-pr-demo/scripts/recording-job.mjs status JOB_ID
node .agents/skills/record-pr-demo/scripts/recording-job.mjs stop JOB_ID
```

`status` never renews the lease. Omit the ID to list active jobs, including jobs whose start response was interrupted. Incomplete or corrupt metadata is reported separately in `unreadableJobs` and does not prevent other jobs from being listed. After `stop`, poll status until it reports `cancelled`, `failed`, or `completed` before reporting the outcome.

If the prompt is canceled, renewals cease and the supervisor interrupts the job after the lease expires. It allows up to 10 seconds for graceful shutdown, then kills remaining recording processes. Explicit stop requests and the default 10-minute maximum job duration use the same cleanup path. `start` accepts `--lease-seconds` and `--max-seconds` to change these limits.

Canceled and failed jobs discard their own artifact directory, including partial MP4s from conversion. Successful jobs retain the MP4, script snapshot, contact sheet, and manifest for review. Status and logs remain available. Jobs manage their own output paths; output-path flags from the direct candidate command are rejected.

Verify the returned manifest before an approved upload. Starting a job never uploads it. Direct `prepare-demo.mjs candidate` remains available for interactive terminal use, without lease supervision.
