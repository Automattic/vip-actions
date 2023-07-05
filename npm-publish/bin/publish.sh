#!/usr/bin/env bash

set -o errexit   # exit on error
set -o errtrace  # exit on error within function/sub-shell
set -o nounset   # error on undefined vars
set -o pipefail  # error if piped command fails

# Default variables
MAIN_BRANCH="$(LC_ALL=C git remote show origin | awk '/HEAD branch/ {print $NF}')"

echo_title() {
	echo ""
	echo "== $1 =="
}

# @todo: Determine version upgrade type
NPM_VERSION_TYPE="major" 

# Fetch some basic package information
echo_title "Fetching local package info"
LOCAL_NAME=$(node -p "require('./package.json').name")
LOCAL_VERSION=$(node -p "require('./package.json').version")
LOCAL_BRANCH=$(git branch --show-current)
REMOTE_VERSION=$(npm view "$LOCAL_NAME" version)
echo "✅ Found $LOCAL_NAME $LOCAL_VERSION on branch $LOCAL_BRANCH"
echo "✅ Published version is $REMOTE_VERSION"

# Validate npm is logged in and ready
echo_title "Checking npm auth"
if ! NPM_USER=$( npm whoami ); then
	echo "❌ npm cli is not authenticated. Please make sure you're logged in or NPM_TOKEN is set."
	exit 201
fi
echo "✅ Logged in as $NPM_USER and ready to publish"

# Validate current branch
echo_title "Checking branch"
# TODO: add support for release/** branch via [ ! "$LOCAL_BRANCH" == "$RELEASE_BRANCH_PATTERN" ] -- will need to add version checking support as well
if [ "$LOCAL_BRANCH" != "$MAIN_BRANCH" ]; then
	echo "❌ You can only publish from the '$MAIN_BRANCH' branch. Please switch branches and try again."
	exit 202
fi
echo "✅ On a valid release branch ($LOCAL_BRANCH)"

# Validate no uncommitted changes.
# Shouldn't happen in CI but protects against local runs.
echo_title "Checking for local changes"
if ! git diff-index --quiet HEAD --; then
	echo "❌ Working directory has uncommitted changes; please clean up before proceeding."
	exit 203
fi
echo "✅ No local changes found"

### TODO=====================
# Validate version not published
# Need a cleaner way to fetch published versions
#echo_title "Checking version"
#IS_VERSION_PUBLISHED=$(npm info . versions --json | grep -q "\"$LOCAL_VERSION\"")
#echo $IS_VERSION_PUBLISHED
### TODO=====================

# Install
echo_title "npm ci + test"

# Install dependencies but skip pre/post scripts since our auth token is in place
npm ci --ignore-scripts

# Run scripts + tests without auth token to prevent malicious access
NODE_AUTH_TOKEN= npm rebuild
NODE_AUTH_TOKEN= npm run prepare --if-present
NODE_AUTH_TOKEN= npm test
echo "✅ npm install + npm test look good"

### DEBUG=====================
### echo "EARLY EXIT BEFORE PUBLISH"
### exit 299
### DEBUG=====================

### TODO=====================
# Confirm y/n (if running locally)
### TODO=====================

# Publish with Dry Run
echo_title "npm publish (dry-run)"
npm publish --access public --dry-run
echo "✅ Dry run looks good"

# Tag git version
echo_title "Tag version in git"
git tag version $LOCAL_VERSION"
echo "✅ Tagged version in git"

# git push
echo_title "git push"
git push --follow-tags
echo "✅ Pushed version bump and tags"

# Publish on GitHub
echo_title "Publishing a new release on GitHub"
gh release create $LOCAL_VERSION --generate-notes
echo "✅ Released version $LOCAL_VERSION on GitHub"

# Publish to NPM
echo_title "npm publish"
npm publish --access public
echo "✅ Successfully published new '$NPM_VERSION_TYPE' release for $LOCAL_NAME as $NEW_VERSION"

# Version bump to dev
# Not needed for release branches so we only do on the main branch
# @todo: Adjust to be done in a branch, then PR and merge PR.
if [ "$LOCAL_BRANCH" == "$MAIN_BRANCH" ]; then
	echo_title "npm version (to next dev)"

	NEXT_LOCAL_DEV_VERSION_TYPE="prepatch"
	if [ "$NPM_VERSION_TYPE" == "major" ]; then
		NEXT_LOCAL_DEV_VERSION_TYPE="preminor"
	elif [ "$NPM_VERSION_TYPE" == "minor" ]; then
		NEXT_LOCAL_DEV_VERSION_TYPE="prepatch"
	fi

	NEXT_LOCAL_DEV_VERSION=$( npm version --no-git-tag-version --preid "dev" "$NEXT_LOCAL_DEV_VERSION_TYPE" )
	git add -u
	git commit -m "Bump to next $NEXT_LOCAL_DEV_VERSION_TYPE: ($NEXT_LOCAL_DEV_VERSION)"
	git push

	NEXT_LOCAL_DEV_VERSION=$(node -p "require('./package.json').version")

	echo "✅ Bumped local version to next $NEXT_LOCAL_DEV_VERSION_TYPE: $NEXT_LOCAL_DEV_VERSION"
fi
