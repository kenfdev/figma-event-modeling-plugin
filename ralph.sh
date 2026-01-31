#!/bin/bash

MAX_ITERATIONS="${1:-5}"

export CLAUDE_CODE_ENABLE_TASKS=true
LOG_DIR="$(dirname "$0")/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/ralph_${TIMESTAMP}.log"

log() {
  echo "$1" | tee -a "$LOG_FILE"
}

log "=== Ralph session started at $(date) ==="
log "Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  log "=== Iteration $i / $MAX_ITERATIONS ==="
  output=$(claude -p "/run-task" --dangerously-skip-permissions 2>&1)
  exit_code=$?
  echo "$output" >> "$LOG_FILE"
  echo "$output"

  if [ $exit_code -ne 0 ]; then
    log "Claude exited with code $exit_code. Stopping."
    break
  fi

  if echo "$output" | grep -q '<promise>COMPLETE</promise>'; then
    log "Task complete. Stopping."
    break
  fi
done

log "=== Ralph session ended at $(date) ==="
log "Log saved to $LOG_FILE"
