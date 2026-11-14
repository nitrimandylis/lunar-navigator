#!/usr/bin/env bash
# Posts one message to the Discord webhook. Everything that talks to Discord uses this.
#
#   WEBHOOK=<url> bash .github/notify.sh "<message>" "<person>" "<bot name>"
#
# <person> is a team name or a GitHub login from team.json, or "" for no ping.

set -euo pipefail

message="$1"
person="${2:-}"
bot_name="${3:-CI}"

if [ -z "${WEBHOOK:-}" ]; then
  echo "DISCORD_WEBHOOK_URL secret is not set" >&2
  exit 1
fi

team_file="$(dirname "$0")/team.json"

if [ -n "$person" ]; then
  discord_id=$(jq -r --arg p "$person" \
    '[.[] | select(.name == $p or .github == $p) | .discord][0] // ""' "$team_file")

  # Only a real numeric id becomes a ping. An unfilled entry stays readable text.
  if [[ "$discord_id" =~ ^[0-9]+$ ]]; then
    message="$message <@$discord_id>"
  else
    message="$message @$person"
  fi
fi

# Discord rejects messages over 2000 characters.
# allowed_mentions: people only, so a message can never trigger @everyone.
jq -n --arg c "$message" --arg u "$bot_name" \
  '{content: $c[0:2000], username: $u, allowed_mentions: {parse: ["users"]}}' \
  | curl -fsS -H 'Content-Type: application/json' -d @- "$WEBHOOK"
