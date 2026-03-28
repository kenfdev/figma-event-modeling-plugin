#!/usr/bin/env bash
# Collects review feedback data from .fdsx/runs/ for self-improvement analysis.
# Extracts reviewer decisions, findings, and fix cycle information from each run.

set -euo pipefail

RUNS_DIR=".fdsx/runs"
LAST_RUN_FILE=".fdsx/self-improve-last-run"
PENDING_FILE=".fdsx/self-improve-last-run.pending"
FDSX_DIR=".fdsx"

mkdir -p "$FDSX_DIR"

if [[ ! -d "$RUNS_DIR" ]]; then
    echo "NO_RUNS"
    exit 0
fi

last_run_dir=""
if [[ -f "$LAST_RUN_FILE" ]]; then
    last_run_dir=$(cat "$LAST_RUN_FILE")
fi

has_new_runs=false
newest_run_dir=""
output=""

while IFS= read -r run_dir; do
    run_json="${run_dir}run.json"
    if [[ ! -f "$run_json" ]]; then
        continue
    fi

    run_name=$(basename "$run_dir" | tr -d '/')

    # Skip runs already analyzed
    if [[ -n "$last_run_dir" ]] && [[ "$run_name" < "$last_run_dir" || "$run_name" == "$last_run_dir" ]]; then
        continue
    fi

    has_new_runs=true
    if [[ -z "$newest_run_dir" ]] || [[ "$run_name" > "$newest_run_dir" ]]; then
        newest_run_dir="$run_name"
    fi

    # Extract flow_name and status from run.json
    flow_info=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
print(d.get('flow_name', 'unknown'))
print(d.get('status', 'unknown'))
# Find review_decision in final_variables
fv = d.get('final_variables', {})
print(fv.get('review_decision', 'UNKNOWN'))
" "$run_json" 2>/dev/null || echo -e "unknown\nunknown\nUNKNOWN")

    flow_name=$(echo "$flow_info" | sed -n '1p')
    run_status=$(echo "$flow_info" | sed -n '2p')
    review_decision=$(echo "$flow_info" | sed -n '3p')

    # Check for fix cycle (presence of fix_*.log or replan_*.log)
    fix_cycle="no"
    if ls "${run_dir}logs/fix_"*.log 1>/dev/null 2>&1 || ls "${run_dir}logs/replan_"*.log 1>/dev/null 2>&1; then
        fix_cycle="yes"
    fi

    # Read review findings from data/review_ref.md
    review_findings=""
    review_ref="${run_dir}data/review_ref.md"
    if [[ -f "$review_ref" ]]; then
        review_findings=$(cat "$review_ref")
    fi

    # Build output block
    block="=== RUN: ${run_name} | FLOW: ${flow_name} | STATUS: ${run_status} ===
REVIEW_DECISION: ${review_decision}
FIX_CYCLE: ${fix_cycle}
REVIEW_FINDINGS:
${review_findings}
=== END ==="

    if [[ -n "$output" ]]; then
        output="${output}

${block}"
    else
        output="$block"
    fi
done < <(ls -1d "$RUNS_DIR"/*/ 2>/dev/null | sort)

if [[ "$has_new_runs" == "false" ]]; then
    echo "NO_RUNS"
    exit 0
fi

echo "$output"

if [[ -n "$newest_run_dir" ]]; then
    printf '%s' "$newest_run_dir" > "$PENDING_FILE"
fi

echo "HAS_RUNS"
