# GTA CRM — Backup & Disaster Recovery Strategy

## 1. Automated Backups (GCP Cloud SQL)

### Configuration
- **Instance:** gta-crm-db (PostgreSQL 15, Enterprise edition)
- **Automated Backups:** Enabled (daily)
- **Backup Window:** 02:00-06:00 UTC
- **Retention:** 7 days (automated), 30 days (on-demand)
- **Point-in-Time Recovery (PITR):** Enabled
- **Storage:** GCP-managed, encrypted at rest

### Verify Backups
```bash
gcloud sql backups list --instance=gta-crm-db
```

## 2. Manual Backup

### Via gcloud CLI
```bash
gcloud sql backups create --instance=gta-crm-db --description="Manual backup $(date +%Y%m%d)"
```

### Via pg_dump (full database export)
```bash
pg_dump "postgresql://postgres:PASSWORD@34.35.133.3:5432/gta_crm?sslmode=require" > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 3. Restore Procedures

### Restore from Automated Backup
```bash
gcloud sql backups restore BACKUP_ID --restore-instance=gta-crm-db
```

### Restore from Point-in-Time
```bash
gcloud sql instances clone gta-crm-db gta-crm-db-restored --point-in-time="2026-04-12T10:00:00Z"
```

### Restore from pg_dump file
```bash
psql "postgresql://postgres:PASSWORD@34.35.133.3:5432/gta_crm?sslmode=require" < backup_file.sql
```

## 4. Disaster Recovery Plan

| Scenario | Recovery Method | RTO | RPO |
|----------|----------------|-----|-----|
| Accidental data deletion | Point-in-time recovery | 1-2 hours | Minutes |
| Database corruption | Restore from daily backup | 2-4 hours | 24 hours max |
| Instance failure | GCP auto-restart + backup restore | 1-2 hours | Minutes (PITR) |
| Region outage | Cross-region replica (if configured) | 4-8 hours | Minutes |

## 5. Monitoring

- GCP Cloud SQL dashboard: Instance health, storage, connections
- Vercel dashboard: Application health, function logs, errors
- Set up GCP alerts for: backup failures, high CPU, storage > 80%
