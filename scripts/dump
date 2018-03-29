#!/usr/bin/env sh

set -e

database="catonline-db"
for collection in games scenarios users; do
  # coerce export to valid JSON
  mongoexport -d $database -c $collection \
  | tr "\n" ",\n" \
  | sed '$s/^/[/' \
  | sed '$s/,$/]/' \
  > ./data/dump/$collection.json
done;
