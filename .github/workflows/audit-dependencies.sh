#!/bin/bash

severity=${1:-"high"}
output_file="audit_output.json"

echo "Auditing for ${severity} vulnerabilities..."

audit_json=$(pnpm audit --prod --json)

echo "${audit_json}" | jq --arg severity "${severity}" '
  .advisories | to_entries |
  map(select(.value.patched_versions != "<0.0.0" and (.value.severity == $severity or ($severity == "high" and .value.severity == "critical"))) |
    {
      package: .value.module_name,
      vulnerable: .value.vulnerable_versions,
      fixed_in: .value.patched_versions,
      findings: .value.findings
    }
  )
' >$output_file

audit_length=$(jq 'length' $output_file)

if [[ "${audit_length}" -gt "0" ]]; then
  echo "Actionable vulnerabilities found in the following packages:"
  jq -r '.[] | "\u001b[1m\(.package)\u001b[0m vulnerable in \u001b[31m\(.vulnerable)\u001b[0m fixed in \u001b[32m\(.fixed_in)\u001b[0m"' $output_file | while read -r line; do echo -e "$line"; done
  echo ""
  echo "Output written to ${output_file}"
  cat $output_file
  echo ""
  echo "This script can be rerun with: './.github/workflows/audit-dependencies.sh $severity'"
  exit 1
else
  echo "No actionable vulnerabilities"
  exit 0
fi
