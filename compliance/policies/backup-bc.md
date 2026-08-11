# Backup & Business Continuity

## Datastore

- Use managed Postgres with point-in-time recovery (PITR) enabled
- Retention: follow provider default ≥ 7 days (increase for production SLAs)

## Application

- Stateless app tier; redeploy from git + env secrets
- Document RTO/RPO targets when customer contracts require them

## Annual restore drill

Template: [`../evidence/backup-restore-drill.md`](../evidence/backup-restore-drill.md)
