.DEFAULT_GOAL := help
SHELL := /bin/bash

COMPOSE := docker compose
FRONTEND := apps/frontend
CONTROL_PLANE := apps/control-plane

.PHONY: help up down dev test lint logs migrate clean psql storybook typecheck

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (infra + control plane)
	$(COMPOSE) up -d --build

down: ## Stop all services
	$(COMPOSE) down

dev: node_modules ## Start frontend dev server
	pnpm dev

node_modules: $(FRONTEND)/package.json package.json
	pnpm install
	@touch node_modules

test: test-frontend test-backend ## Run all tests

test-frontend: node_modules ## Run frontend tests (vitest)
	pnpm test

test-backend: ## Run control plane tests (pytest)
	cd $(CONTROL_PLANE) && pip install -q -e ".[dev]" && pytest tests/ -v

lint: node_modules ## Lint frontend
	pnpm --filter frontend lint

typecheck: node_modules ## TypeScript type check
	pnpm --filter frontend typecheck

storybook: node_modules ## Start Storybook
	pnpm storybook

logs: ## Tail docker compose logs
	$(COMPOSE) logs -f --tail=100

logs-%: ## Tail logs for a specific service (e.g. make logs-control-plane)
	$(COMPOSE) logs -f --tail=100 $*

migrate: ## Run Alembic migrations against local Postgres
	cd $(CONTROL_PLANE) && DATABASE_URL=postgresql://mycelium:mycelium@localhost:5432/mycelium alembic upgrade head

psql: ## Open psql shell to local Postgres
	docker exec -it $$($(COMPOSE) ps -q postgres) psql -U mycelium

clean: ## Remove volumes, node_modules, rebuild from scratch
	$(COMPOSE) down -v
	rm -rf node_modules $(FRONTEND)/node_modules $(FRONTEND)/.next
	$(COMPOSE) up -d --build
	pnpm install

healthcheck: ## Check if all services are healthy
	@echo "--- Service Health ---"
	@$(COMPOSE) ps --format "table {{.Name}}\t{{.Status}}"
