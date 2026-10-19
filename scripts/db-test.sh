#!/usr/bin/env sh
# Sobe um Postgres descartável, aplica migrations + seed e roda os testes do banco.
set -eu

cd "$(dirname "$0")/.."
name="arena-viva-db-test-$$"

docker run -d --rm --name "$name" -e POSTGRES_PASSWORD=test postgres:17-alpine >/dev/null
trap 'docker rm -f "$name" >/dev/null 2>&1' EXIT

until docker exec "$name" pg_isready -U postgres -q 2>/dev/null; do sleep 0.5; done
sleep 1

run() { docker exec -i "$name" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

run < supabase/tests/supabase_stub.sql
for file in supabase/migrations/*.sql; do run < "$file"; done
run < supabase/seed.sql
run < supabase/tests/db_test.sql
