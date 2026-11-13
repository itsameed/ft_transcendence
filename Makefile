COMPOSE := docker compose

.PHONY: help up start down reset restart build rebuild pull logs ps config backup restore

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