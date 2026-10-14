COMPOSE := docker compose

.PHONY: help up start down restart build rebuild pull logs ps config

help:
	@echo "Available targets:"
	@echo "  make start    Start the server in detached mode"
	@echo "  make up       Start services in detached mode"
	@echo "  make down     Stop and remove services"
	@echo "  make build    Build service images"
	@echo "  make rebuild  Rebuild images without cache and start services"
	@echo "  make restart  Restart services"
	@echo "  make logs     Follow service logs"
	@echo "  make ps       Show running services"
	@echo "  make pull     Pull service images"
	@echo "  make config   Validate and print the Compose configuration"

start: up

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

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
