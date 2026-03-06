up:
	docker compose up -d --build --force-recreate --remove-orphans

down:
	docker compose down

run_ui:
	cd ui && pnpm run dev || cd -

backup:
	./scripts/backup.sh

restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backups/pentaract_YYYYMMDD_HHMMSS.sql"; exit 1; fi
	./scripts/restore.sh $(FILE)
