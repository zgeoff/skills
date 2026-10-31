#!/usr/bin/env bash
# Appends one row to a figure-it-out decision log (TSV), and writes the header on first use.
# Usage: log.sh <logfile> <phase> <decision> <why> <evidence> <result>
set -euo pipefail

if [ "$#" -ne 6 ]; then
  echo "usage: log.sh <logfile> <phase> <decision> <why> <evidence> <result>" >&2
  exit 2
fi

logfile=$1
shift

mkdir -p "$(dirname "$logfile")"

# Appends the header with >>, never >: a test that misreads an existing log then costs one stray
# header line, and keeps the rows.
if [ ! -s "$logfile" ]; then
  printf 'ts\tphase\tdecision\twhy\tevidence\tresult\n' >>"$logfile"
fi

# Keeps each cell on one line, and puts a quote before a cell that a spreadsheet would read as a
# formula, since evidence such as a PR title or a file name can come from someone else.
clean() {
  local value
  value=$(printf '%s' "$1" | tr '\t\n\r' '   ')
  case $value in
    =* | +* | -* | @*) printf "'%s" "$value" ;;
    *) printf '%s' "$value" ;;
  esac
}

printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(clean "$1")" \
  "$(clean "$2")" "$(clean "$3")" "$(clean "$4")" "$(clean "$5")" >>"$logfile"
