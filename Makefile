.PHONY: dev dev-stop test test-unit test-integration

# Start the full local dev stack: Supabase local (Docker) then Vercel dev API.
# Supabase CLI start is synchronous — it blocks until the local stack is ready,
# then Vercel dev starts on port 3000.
#
# Prerequisites:
#   Docker Desktop running
#   supabase CLI  — https://supabase.com/docs/guides/cli
#   Vercel CLI    — npm install -g vercel
#   .env.local    — copy .env.test and set SUPABASE_URL to local stack URL
dev:
	supabase start
	vercel dev

dev-stop:
	supabase stop

test:
	npm test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration
