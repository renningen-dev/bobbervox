.PHONY: install dev build lint format test test-run help

help:
	@echo "Available commands:"
	@echo "  make install   - Install dependencies"
	@echo "  make dev       - Start development server"
	@echo "  make build     - Build for production"
	@echo "  make lint      - Run ESLint"
	@echo "  make format    - Format code with Prettier"
	@echo "  make test      - Run tests in watch mode"
	@echo "  make test-run  - Run tests once"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

format:
	npx prettier --write "src/**/*.{ts,tsx}"

test:
	npm run test

test-run:
	npm run test:run
