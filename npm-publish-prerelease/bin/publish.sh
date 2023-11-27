#!/bin/sh

set -eu

# Set inputs
: "${NPM_TAG:=next}"
: "${PROVENANCE:=false}"

echo_title() {
	echo ""
	echo "== $1 =="
}

# Fetch some basic package information
echo_title "Fetching local package info"
LOCAL_NAME=$(node -p "require('./package.json').name")
LOCAL_VERSION=$(node -p "require('./package.json').version")
LOCAL_BRANCH=$(git branch --show-current)
echo "✅ Found ${LOCAL_NAME} ${LOCAL_VERSION} on branch ${LOCAL_BRANCH}"

# Validate npm is logged in and ready
echo_title "Checking npm auth"
if ! NPM_USER=$(npm whoami); then
	echo "❌ npm cli is not authenticated. Please make sure you're logged in or NPM_TOKEN is set."
	exit 202
fi
echo "✅ Logged in as ${NPM_USER} and ready to publish"

# Validate no uncommitted changes.
# Shouldn't happen in CI but protects against local runs.
echo_title "Checking for local changes"
if ! git diff-index --quiet HEAD --; then
	echo "❌ Working directory has uncommitted changes; please clean up before proceeding."
	exit 204
fi
echo "✅ No local changes found"

# Install
echo_title "npm ci + test"

# Install dependencies but skip pre/post scripts since our auth token is in place
npm ci --ignore-scripts

# Run scripts + tests without auth token to prevent malicious access
NODE_AUTH_TOKEN='' npm rebuild
NODE_AUTH_TOKEN='' npm run prepare --if-present
NODE_AUTH_TOKEN='' npm test
echo "✅ npm install + npm test look good"

# Confirm y/n (if running locally)
if [ -t 0 ]; then
	echo_title "Confirm release"
	printf "Are you sure you want to publish a new release? (y/n)"
	read -r yn
	case $yn in
		[Yy]*) 
		;;

		*)
			echo "❌ Aborting release"
			exit 205
		;;
	esac
fi

# Publish with Dry Run
echo_title "npm publish (dry-run)"
npm publish --access public --tag "${NPM_TAG}" --dry-run
echo "✅ Dry run looks good"

# Publish on GitHub and tag
echo_title "Publishing a new release on GitHub and tagging"
gh release create "${LOCAL_VERSION}" --generate-notes --prerelease --target "${LOCAL_BRANCH}"
echo "✅ Released version ${LOCAL_VERSION} on GitHub and tagged"

# Publish to NPM
echo_title "npm publish"
OPTIONS="--access public --tag ${NPM_TAG}"
if [ "${PROVENANCE}" = "true" ] && [ "${CI:-}" = "true" ] && [ "${GITHUB_ACTIONS:-}" = "true" ]; then
	OPTIONS="${OPTIONS} --provenance"
fi

# shellcheck disable=SC2086 # We want to pass the options as a string
npm publish ${OPTIONS}
echo "✅ Successfully published new release for ${LOCAL_NAME} as ${LOCAL_VERSION}"
