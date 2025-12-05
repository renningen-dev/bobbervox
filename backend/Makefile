.PHONY: install test lint format run migrate revision help

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest
RUFF := $(VENV)/bin/ruff
ALEMBIC := $(VENV)/bin/alembic
UVICORN := $(VENV)/bin/uvicorn

help:
	@echo "Available commands:"
	@echo "  make install    - Create venv and install dependencies"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run ruff linter"
	@echo "  make format     - Format code with ruff"
	@echo "  make run        - Start development server"
	@echo "  make migrate    - Apply database migrations"
	@echo "  make revision   - Create new migration (use: make revision m='message')"

install:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -e ".[dev]"

test:
	$(PYTEST) tests -v

lint:
	$(RUFF) check .

format:
	$(RUFF) check --fix .
	$(RUFF) format .

run:
	$(UVICORN) app.main:app --reload

migrate:
	$(ALEMBIC) upgrade head

revision:
	$(ALEMBIC) revision --autogenerate -m "$(m)"
