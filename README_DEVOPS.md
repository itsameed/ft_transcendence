# DevOps setup

The application runs through Docker Compose using six containers:

- MongoDB stores application data.
- Database backup creates scheduled MongoDB backups and removes expired backups.
- Backend runs the Node.js API.
- Frontend uses Nginx to serve the website and forward requests to the backend.
- Prometheus collects backend metrics and evaluates alerting rules.
- Grafana displays the collected metrics.

## Requirements

Install Docker and Docker Compose before starting the project.

## Environment setup

Create the private environment file:

```bash
cp .env.example .env
```

Generate the session secret:

```bash
openssl rand -hex 32
```

Add the generated value to `SESSION_SECRET` in `.env`.

Set values for:

```env
MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=
GF_SECURITY_ADMIN_USER=
GF_SECURITY_ADMIN_PASSWORD=
```

`MONGO_URL` can remain empty because Docker Compose creates it from the MongoDB username and password.

Google authentication, email and AI variables are optional during local testing. Their values can remain empty or disabled when those features are not being tested.

Never commit the private `.env` file.

## Start the project

Build and start every service:

```bash
docker compose up -d --build
```

Or use:

```bash
make up
```

Check the containers:

```bash
docker compose ps
```

All application and monitoring containers should become healthy, while the database backup container should remain running.

## Local addresses

- Application: `https://localhost:8443`
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

The HTTPS certificate is self-signed for local development, so the browser will display a warning the first time.

Requests to `http://localhost:8080` are redirected to HTTPS.

## Health checks

Test the application through Nginx:

```bash
curl -k https://localhost:8443/health
```

Expected response:

```json
{"status":"ok"}
```

Test Prometheus:

```bash
curl http://localhost:9090/-/healthy
```

Test Grafana:

```bash
curl http://localhost:3001/api/health
```

## Monitoring

Log in to Grafana using `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD` from `.env`.

Open:

`Dashboards → Tally Monitoring → Tally Backend Overview`

The dashboard displays request rate, response time, memory usage and CPU usage.

### Alerting rules

Prometheus evaluates the following backend alerts:

- `BackendDown`: backend cannot be reached for one minute.
- `HighBackendMemory`: memory usage exceeds 500 MB for five minutes.
- `HighBackendCPU`: CPU usage exceeds 80 percent for five minutes.
- `SlowBackendResponses`: the 95th percentile response time exceeds one second for five minutes.
- `HighBackendErrorRate`: more than five percent of requests return server errors for five minutes.

Loaded alert rules can be checked with:

```bash
curl http://localhost:9090/api/v1/rules
```

## Database backups

### Automatic backups

The `db-backup` container creates a backup immediately when it starts and then creates another backup every 24 hours.

Backups older than seven days are deleted automatically.

Check the backup container:

```bash
docker compose ps db-backup
```

View its logs:

```bash
docker compose logs db-backup
```

Automatic backups are saved inside `database-backups/`.

### Manual backup

Create a backup manually:

```bash
make backup
```

Backup files are ignored by Git.

### Restore a backup

List the available backups:

```bash
ls -lh database-backups
```

Restore the selected backup:

```bash
make restore FILE=database-backups/<backup-file>
```

Restoring uses `--drop`, so the current database collections are replaced by the contents of the selected backup.

After restoring, restart the backend:

```bash
docker compose restart backend
```

Verify the application:

```bash
curl -k https://localhost:8443/health
```

Log in and confirm that the expected users, groups and expenses are present.

## Disaster recovery procedure

If the MongoDB data is lost or corrupted:

1. Stop the backend to prevent new database changes:

```bash
docker compose stop backend
```

2. Confirm that MongoDB is running:

```bash
docker compose up -d mongodb
```

3. List the available backups:

```bash
ls -lh database-backups
```

4. Restore the most recent valid backup:

```bash
make restore FILE=database-backups/<backup-file>
```

5. Start the backend again:

```bash
docker compose up -d backend
```

6. Verify the backend health:

```bash
curl -k https://localhost:8443/health
```

7. Log in to the application and verify the restored data.

## Useful commands

```bash
make help
make up
make down
make build
make rebuild
make restart
make logs
make ps
make config
make backup
```

## Stop the project

Stop and remove the containers:

```bash
make down
```

Persistent Docker volumes keep the MongoDB data, uploaded avatars, Prometheus data and Grafana data.

To remove those volumes as well:

```bash
docker compose down -v
```

Only use `-v` when the stored local data is no longer needed.

## Service status page

The service status page shows the current state of the frontend, backend, MongoDB, Prometheus, and Grafana.

Open:

```text
https://localhost:8443/service-status.html