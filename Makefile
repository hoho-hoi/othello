.PHONY: test lint format clean help setup

setup:
	npm ci

test:
	npm run test

lint:
	npm run lint
	npm run typecheck
	npm run format:check

format:
	npm run format

clean:
	rm -rf scratch/*
	rm -rf node_modules/
	rm -rf dist/
	@echo "Cleaned scratch directory and build artifacts."

help:
	@echo "Available commands:"
	@echo "  make test    - Run tests"
	@echo "  make lint    - Run linters, typecheck, and format check"
	@echo "  make format  - Format code"
	@echo "  make setup   - Install dependencies (npm ci)"
	@echo "  make clean   - Clean artifacts"