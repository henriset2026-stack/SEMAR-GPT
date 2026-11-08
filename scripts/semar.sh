#!/usr/bin/env bash
# SEMAR-GPT stack helper. Run from anywhere: ./scripts/semar.sh start
set -euo pipefail

cd "$(dirname "$0")/.."

if docker compose version >/dev/null 2>&1; then
  compose() { docker compose "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
  compose() { docker-compose "$@"; }
else
  echo "Docker Compose is not available. Install Docker Desktop or the Compose plugin." >&2
  exit 1
fi

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Start Docker Desktop first." >&2
    exit 1
  fi
}

usage() {
  cat <<'EOF'
Usage: ./scripts/semar.sh <command>

Commands:
  start     Build/start the SEMAR-GPT stack in the background
  stop      Stop the stack (keeps data volumes)
  restart   Restart the stack
  status    Show service status
  logs      Follow the API logs
  reset     Stop the stack and delete its data volumes (destructive)
EOF
}

case "${1:-start}" in
  start)
    require_docker
    compose up -d --build
    echo
    echo "SEMAR-GPT is starting at http://localhost:3080"
    echo "First visit: register the first account, then configure a model provider."
    ;;
  stop)
    require_docker
    compose down
    ;;
  restart)
    require_docker
    compose restart
    ;;
  status)
    require_docker
    compose ps
    ;;
  logs)
    require_docker
    compose logs -f api
    ;;
  reset)
    require_docker
    read -r -p "Delete SEMAR-GPT containers and data volumes? [y/N] " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      compose down -v
      echo "SEMAR-GPT data volumes removed."
    else
      echo "Cancelled."
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
