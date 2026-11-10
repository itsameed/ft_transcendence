# DevOps setup

The application runs through Docker Compose using five containers:

- MongoDB stores application data.
- Backend runs the Node.js API.
- Frontend uses Nginx to serve the website and forward requests to the backend.
- Prometheus collects backend metrics.
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

All five containers should become healthy.

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

## Database backups

Create a backup:

```bash
make backup
```

Backups are saved inside `database-backups/` and are ignored by Git.

Restore a backup:

```bash
make restore FILE=database-backups/<backup-file>
```

Restoring replaces the current database contents with the contents of the selected backup.

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