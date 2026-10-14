# Cera Dental Lab — Session Handoff

## 1. Purpose

This file records the latest project state for the next chatbot/development session.

Current handoff date: **2026-10-14**

---

## 2. Current Project Position

The Cera Dental Lab application is **live in production**.

Current public address:

`https://16.16.51.55`

Completed project boundary:

**Module 9 — Production Deployment**

Current active module:

**Module 10 — Final Documentation & Monitoring**

---

## 3. Production Topology

```text
Internet
  ↓ HTTPS
AWS EC2 host Nginx
  ↓
127.0.0.1:8080
  ↓
Docker web/Nginx container
  ↓ /api/*
Docker API container :4000
  ↓
MongoDB Atlas
Cloudflare R2
```

Important boundaries:

- EC2 is the production compute host.
- MongoDB is not self-hosted on EC2; production uses MongoDB Atlas.
- Redis is not used by the current production runtime.
- Cloudflare R2 stores private supporting attachments.
- The API's port `4000` is not published to the EC2 host.
- Docker web is bound to `127.0.0.1:8080`, so it is not directly public.
- Host Nginx is the public entry point.
- HTTP redirects to HTTPS.
- The current IP-address HTTPS certificate is managed through Certbot. Renewal/reload configuration should be verified as part of Module 10 operational checks.

---

## 4. Production Environment

Production API environment file on EC2:

`/opt/cera/deploy/api.production.env`

Production Compose environment file:

`/opt/cera/.env`

Important rules:

- Never commit the real production environment file.
- Do not paste production secrets into chat.
- `NODE_ENV=production`.
- `PORT=4000`.
- `CLIENT_URL` must match the public HTTPS origin.
- Atlas/R2/auth secrets remain only in the production environment.

Current public origin:

`https://16.16.51.55`

When a real domain is adopted, update `CLIENT_URL` and TLS/reverse-proxy configuration to that domain.

---

## 5. Containers and Registry

Production images are published to GHCR:

- `ghcr.io/shamilalicholayil/cera-dental-lab-api`
- `ghcr.io/shamilalicholayil/cera-dental-lab-web`

Production releases use exact commit-SHA tags.

`latest` may also be published, but the deployed release should be pinned to the release SHA for traceability and rollback.

Production Compose file:

`/opt/cera/compose.production.yml`

---

## 6. CI/CD

Current release flow:

```text
push to master
↓
Production Compose Check
↓ success
Publish Production Images
↓
GHCR SHA-tagged API/web images
↓
SSH deployment to EC2
↓
docker compose pull/up
↓
health verification
↓
success OR rollback
```

Security characteristics:

- GitHub Actions uses the configured EC2 SSH private key.
- EC2 SSH host identity is pinned.
- Do not disable SSH host-key checking.
- The workflow deploys only after the production gate succeeds.
- Deployment health is checked through the actual Nginx → API path.
- Failed deployments restore previous image references and restart the previous release.

---

## 7. Verification Completed

The deployment gate included:

```text
npm run test:api
npm run test:web
npm run lint:web
npm run lint:api
npm run build:web
npm run test:e2e
```

The user reported all of these passing before deployment.

Production container/image/Compose CI checks also passed.

The live deployment was verified healthy through:

`/api/v1/health`

with MongoDB reporting connected/ready.

---

## 8. Reverse Proxy / Trust Boundary

There are two Nginx layers:

1. host Nginx on EC2 — public HTTP/HTTPS entry point
2. Docker web/Nginx — serves React and proxies `/api/*` to the API container

The API enables Express `trust proxy` in production for the controlled proxy path.

Forwarded client/protocol headers must be preserved across the Docker Nginx layer so rate limiting, secure-origin behavior, and logging see the intended client/protocol information.

---

## 9. Authentication Production Notes

Current architecture remains:

- access JWT: 15 minutes
- rotating opaque refresh token: 10 days
- HttpOnly cookies
- Secure cookies in production
- SameSite=Lax
- Argon2id password hashing
- backend authorization is the security boundary
- CSRF origin checking for unsafe requests

Because production cookies are Secure, public production must remain HTTPS.

---

## 10. Production Admin

The first/required production admin is created using the existing workspace command inside the running API container:

```bash
cd /opt/cera

docker compose \
  --env-file .env \
  -f compose.production.yml \
  exec api npm run create:admin
```

Do not store an admin password in documentation or Git.

---

## 11. Current Storage Boundaries

MongoDB Atlas:

- application data
- production database is external to EC2

Cloudflare R2:

- private supporting attachments
- application uses S3-compatible API

Raw intraoral scan files remain outside ordinary website attachment storage/integration.

---

## 12. Current Public-Network Boundary

Intended public ports:

- `80` — HTTP redirect / ACME challenge
- `443` — HTTPS application traffic
- `22` — SSH only as required by the chosen deployment/administration model and security-group policy

Must not be publicly exposed:

- API `4000`
- Docker web `8080`
- MongoDB `27017`

---

## 13. Remaining Module 10 Work

Still to finish:

1. confirm/document MongoDB Atlas backup and restore behavior for the actual Atlas tier
2. define R2 retention/backup/recovery expectations
3. select uptime monitoring
4. select application error monitoring if desired
5. decide log retention/centralization requirements
6. write final troubleshooting/runbook instructions
7. record final production QA
8. document domain migration when a domain is selected

The final domain is not yet selected. The IP-based HTTPS launch is intentionally temporary.

---

## 14. Development Rules That Still Apply

- Do not assume missing business rules.
- Inspect current repository/code before implementation changes.
- Keep route definitions outside `App.jsx`.
- Use Redux Toolkit only for appropriate app-wide state.
- Keep local UI/form state local where practical.
- Test normal flows, permissions, validation, failures, and edge cases.
- Keep UI/UX, security, cleanup, logging, and error handling continuous.
- After a completed development module/change with passing checks, commit and push before starting unrelated work.
- Never commit production secrets.

---

## 15. Next Session Start

Start from:

```text
Module 10 — Final Documentation & Monitoring
```

Do not return to Module 4D discovery. The application has already progressed through production deployment and is live.
