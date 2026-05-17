# Security Rotation Runbook (Vercel + Supabase)

This runbook is for moving from incident posture to stable production posture with low downtime risk.

## 1. Scope
- Supabase keys (`sb_secret`, publishable key, optional legacy `service_role`/JWT keys)
- SMTP credentials
- Third-party API tokens (SportMonks, reCAPTCHA)
- Vercel environment variables and redeploy flow

## 2. Prerequisites
- Access to Vercel project settings and deployments
- Access to Supabase project settings
- Access to email provider (Gmail app password) and SportMonks account
- Incident ticket ID for traceability

## 3. Local Preflight (required before prod)
Run:

```bash
npm run security:preflight
```

Then run:

```bash
npm run build
```

## 4. Rotation Order (zero/minimal downtime)
Do not revoke old credentials until new deploys are healthy.

1. Generate new credentials at providers.
2. Update Vercel env vars first.
3. Redeploy production.
4. Validate app health.
5. Revoke/delete old credentials.
6. Redeploy previews/branches if they also used old credentials.

## 5. Supabase Checklist

### 5.1 API key strategy
- Prefer new keys: `sb_publishable_...` and `sb_secret_...`
- Avoid relying on legacy JWT `service_role` key when possible.

Reference:
- Supabase API Keys guide: https://supabase.com/docs/guides/getting-started/api-keys
- JWT signing keys guide: https://supabase.com/docs/guides/auth/signing-keys

### 5.2 Secret key rotation
1. Open Supabase Dashboard → Settings → API Keys.
2. Create a new secret key (`sb_secret_...`).
3. Keep old key active until rollout validation passes.
4. Update `SUPABASE_SECRET_KEY` in Vercel (Production first).
5. Redeploy production.
6. Validate admin/dashboard/API behavior.
7. Delete compromised/old secret key.

### 5.3 If still using legacy `service_role` JWT
- Migrate to `sb_secret_...` first if possible.
- If forced to rotate legacy JWT signing material, use Supabase JWT Keys flow and plan strict maintenance window.

Reference:
- Legacy rotation caveats: https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd

## 6. Vercel Checklist

Reference:
- Rotating env vars safely: https://vercel.com/docs/environment-variables/rotating-secrets
- CLI env management: https://vercel.com/docs/cli/env
- Redeploy CLI: https://vercel.com/docs/cli/redeploy

### 6.1 Update env vars
Via dashboard (recommended) or CLI:

```bash
vercel env add SUPABASE_SECRET_KEY production --force
vercel env add SMTP_PASS production --force
vercel env add SPORTMONKS_API_TOKEN production --force
vercel env add RECAPTCHA_SECRET_KEY production --force
```

Repeat for `preview` and `development` as needed.

### 6.2 Redeploy
1. Redeploy latest production deployment.
2. If team-level/shared vars are used, redeploy all impacted projects.

CLI example:

```bash
vercel redeploy <deployment-url-or-id>
```

## 7. Credential-Specific Steps

### 7.1 Gmail SMTP app password
1. Revoke old app password.
2. Generate new app password.
3. Update `SMTP_PASS` in Vercel.
4. Redeploy and send test from `/api/contact`.

### 7.2 SportMonks token
1. Regenerate token in SportMonks.
2. Update `SPORTMONKS_API_TOKEN`.
3. Redeploy.
4. Verify `/api/upsl/fixtures` and `/api/upsl/livescores`.

### 7.3 reCAPTCHA keys
1. Create production site + secret keys in Google reCAPTCHA.
2. Replace test keys:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`
3. Redeploy.
4. Validate contact and registration forms.

## 8. Post-Rotation Validation
- Login/logout works
- Dashboard data loads
- Contact form submits and emails send
- Registration flow works including file upload
- UPSL endpoints return healthy responses
- No spike in 401/403/429/500 in logs

## 9. Rollback Plan
- Keep old credentials active until validation complete.
- If failure:
  1. Restore previous env values in Vercel.
  2. Redeploy immediately.
  3. Re-run smoke tests.

Do not revoke old credentials until stable.

## 10. Hardening Follow-ups
- Set `ALLOWED_ORIGINS` explicitly in production.
- Keep `ENABLE_AUTH_BOOTSTRAP` disabled in production.
- Review Supabase Security Advisor findings and RLS policies.
- Repeat rotation quarterly or on incident trigger.
