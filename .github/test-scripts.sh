#!/usr/bin/env bash
# Smallest check for notify.sh and check.sh. Run: bash .github/test-scripts.sh
# Uses a fake curl, so nothing reaches Discord.

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Fake curl: saves the JSON body it was given.
mkdir "$tmp/bin"
cat > "$tmp/bin/curl" <<EOF
#!/usr/bin/env bash
cat > "$tmp/body.json"
EOF
chmod +x "$tmp/bin/curl"

# A team file with one filled-in person, next to a copy of notify.sh.
mkdir "$tmp/gh"
cp "$here/notify.sh" "$tmp/gh/"
cat > "$tmp/gh/team.json" <<'EOF'
[
  { "name": "gio", "github": "supergioo0", "discord": "123" },
  { "name": "koum", "discord": "FILL_IN" }
]
EOF

send() {
  PATH="$tmp/bin:$PATH" WEBHOOK=https://example.invalid bash "$tmp/gh/notify.sh" "$@"
}

content() {
  jq -r .content "$tmp/body.json"
}

send "hi" "gio" "CI"
[ "$(content)" = "hi <@123>" ] || { echo "FAIL: ping by name"; exit 1; }

send "hi" "supergioo0" "CI"
[ "$(content)" = "hi <@123>" ] || { echo "FAIL: ping by github login"; exit 1; }

send "hi" "koum" "CI"
[ "$(content)" = "hi @koum" ] || { echo "FAIL: unfilled id must not become a ping"; exit 1; }

send "hi" "" "CI"
[ "$(content)" = "hi" ] || { echo "FAIL: no person means no ping"; exit 1; }

send "hi @everyone" "" "CI"
[ "$(jq -r '.allowed_mentions.parse[0]' "$tmp/body.json")" = "users" ] || { echo "FAIL: mentions not limited"; exit 1; }

send "$(printf 'x%.0s' $(seq 1 2500))" "" "CI"
[ "$(content | tr -d '\n' | wc -c | tr -d ' ')" = "2000" ] || { echo "FAIL: not cut to 2000"; exit 1; }

if PATH="$tmp/bin:$PATH" WEBHOOK="" bash "$tmp/gh/notify.sh" "hi" 2> /dev/null; then
  echo "FAIL: a missing webhook must fail"
  exit 1
fi

# check.sh: passes with no stack, fails when the check script fails.
mkdir "$tmp/empty" "$tmp/broken"
(cd "$tmp/empty" && bash "$here/check.sh" > /dev/null) || { echo "FAIL: empty repo must pass"; exit 1; }

echo '{"scripts":{"check":"false"}}' > "$tmp/broken/package.json"
if (cd "$tmp/broken" && bash "$here/check.sh" > /dev/null 2>&1); then
  echo "FAIL: a failing check script must fail"
  exit 1
fi

echo "all ok"
