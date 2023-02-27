#!/usr/bin/env bash

# Print output and save to variable for inspection. We need to inspect because
# it always exits with zero.
# https://github.com/naugtur/can-i-ignore-scripts/pull/25
CHECK_OUTPUT="$(npx can-i-ignore-scripts@0.1.9 | tee /dev/stderr)"

if printf "%s" "$CHECK_OUTPUT" | grep -qE '^\[ +(keep|check\?) +\]'; then
	echo "Non-ignorable install scripts found!"
	exit 1
fi
