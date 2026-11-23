COMPOSE := docker compose

.PHONY: help up start dev down reset restart build rebuild pull logs ps config backup restore seed seed-advanced seed-clean

help:
	@echo "Available targets:"
	@echo "  make start                 Build and start all services"
	@echo "  make up                    Start services using existing images"
	@echo "  make down                  Stop services and preserve data"
	@echo "  make reset                 Stop services and delete local Docker data"
	@echo "  make build                 Build service images"
	@echo "  make rebuild               Rebuild images without cache and start services"
	@echo "  make restart               Restart services"
	@echo "  make logs                  Follow service logs"
	@echo "  make ps                    Show running services"
	@echo "  make pull                  Pull service images"
	@echo "  make config                Validate the Compose configuration"
	@echo "  make backup                Create a database backup"
	@echo "  make restore FILE=<path>   Restore a database backup"
	@echo "  make seed                  Wipe the database and load the basic seed"
	@echo "  make seed-advanced         Wipe the database and load the advanced seed"
	@echo "  make seed-clean            Wipe the database without seeding"

start:
	$(COMPOSE) up -d --build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

reset:
	@printf "Delete all local Docker data? Type yes to continue: "; read answer; if [ "$$answer" = "yes" ]; then $(COMPOSE) down -v --remove-orphans; else echo "Cancelled"; fi

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

restart:
	$(COMPOSE) restart

pull:
	$(COMPOSE) pull

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

config:
	$(COMPOSE) config

backup:
	./scripts/backup-db.sh

restore:
	@test -n "$(FILE)" || (echo "Usage: make restore FILE=database-backups/<backup-file>" && exit 1)
	./scripts/restore-db.sh "$(FILE)"

# Seeds run inside the backend container so they use its MONGO_URL.
# The scripts are copied in first, so a stale image still gets the latest seed.
SEED_RUN = $(COMPOSE) cp backend/scripts/. backend:/app/scripts/ && $(COMPOSE) exec backend node

seed:
	$(SEED_RUN) scripts/seed.js

seed-advanced:
	$(SEED_RUN) scripts/seed-advanced.js

seed-clean:
	$(SEED_RUN) scripts/seed.js --clean
