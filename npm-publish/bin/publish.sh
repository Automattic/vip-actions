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

# Determine which files were changed in PR
echo_title "Determining which files were changed in PR #$PR_NUMBER"
PR_FILES_CHANGED=`gh pr diff "$PR_NUMBER" --name-only | grep -v \.json`

if [ "$PR_FILES_CHANGED" != "" ] ; then
	echo "❌ Unexpected files changed in PR ($PR_FILES_CHANGED)"
else
	echo "✅ Determined only package.json is changed in PR"
fi

# Determine release type
echo_title "Checking out PR #$PR_NUMBER and determining NPM release type"
gh pr checkout "$PR_NUMBER"
echo "✅ Checked out PR"

NPM_VERSION_TYPE=`git branch | awk -F '/' '{print $2}' | awk -F '-' '{print $1}'`

# Validate release type value
if [ "$NPM_VERSION_TYPE" != "major" ] && [ "$NPM_VERSION_TYPE" != "minor" ] && [ "$NPM_VERSION_TYPE" != "patch" ]; then
	echo "❌ Invalid release type found."
	exit 200
else
	echo "✅ NPM release type: $NPM_VERSION_TYPE"
fi

git fetch origin "$MAIN_BRANCH"
echo "✅ Fetched $MAIN_BRANCH from GitHub"

git checkout "$MAIN_BRANCH"
echo "✅ Checked out branch $MAIN_BRANCH"

# Fetch some basic package information
echo_title "Fetching local package info"
LOCAL_NAME=$(node -p "require('./package.json').name")
LOCAL_VERSION=$(node -p "require('./package.json').version")
LOCAL_BRANCH=$(git branch --show-current)
REMOTE_VERSION=$(npm view "$LOCAL_NAME" version)
echo "✅ Found $LOCAL_NAME $LOCAL_VERSION on branch $LOCAL_BRANCH"
echo "✅ Published version is $REMOTE_VERSION"

# Validate npm is logged in and ready
# @todo: remove
#echo_title "Checking npm auth"
#if ! NPM_USER=$( npm whoami ); then
#	echo "❌ npm cli is not authenticated. Please make sure you're logged in or NPM_TOKEN is set."
#	exit 201
#fi
#echo "✅ Logged in as $NPM_USER and ready to publish"

# Validate current branch
echo_title "Checking branch"
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
# @todo: remove
#npm ci --ignore-scripts

# @todo: remove
# Run scripts + tests without auth token to prevent malicious access
#NODE_AUTH_TOKEN= npm rebuild
#NODE_AUTH_TOKEN= npm run prepare --if-present
#NODE_AUTH_TOKEN= npm test
#echo "✅ npm install + npm test look good"

### DEBUG=====================
### echo "EARLY EXIT BEFORE PUBLISH"
### exit 299
### DEBUG=====================

### TODO=====================
# Confirm y/n (if running locally)
### TODO=====================

# Publish with Dry Run
# @todo: Remove
# echo_title "npm publish (dry-run)"
# npm publish --access public --dry-run
# echo "✅ Dry run looks good"

# Publish on GitHub and tag
echo_title "Publishing a new release on GitHub and tagging"
gh release create $LOCAL_VERSION --generate-notes --target $MAIN_BRANCH 
echo "✅ Released version $LOCAL_VERSION on GitHub and tagged"

# @todo: remove
# Publish to NPM
#echo_title "npm publish"
#npm publish --access public
#echo "✅ Successfully published new '$NPM_VERSION_TYPE' release for $LOCAL_NAME as $NEW_VERSION"

# Version bump to dev - create a branch and a PR, then merge
if [ "$LOCAL_BRANCH" == "$MAIN_BRANCH" ]; then
	echo_title "npm version (to next dev)"

	NEXT_LOCAL_DEV_VERSION_TYPE="prepatch"
	if [ "$NPM_VERSION_TYPE" == "major" ]; then
		NEXT_LOCAL_DEV_VERSION_TYPE="preminor"
	elif [ "$NPM_VERSION_TYPE" == "minor" ]; then
		NEXT_LOCAL_DEV_VERSION_TYPE="prepatch"
	fi

	NEXT_LOCAL_DEV_VERSION=$( npm version --no-git-tag-version --preid "dev" "$NEXT_LOCAL_DEV_VERSION_TYPE" )
	echo "✅ Determined next local dev version: $NEXT_LOCAL_DEV_VERSION"

	# Configure git
 	echo_title "Configure git"
	git config push.autoSetupRemote true
 	echo "✅ Configured git to auto-setup remote origins"

	# Checkout branch for release
	echo_title "Create new git branch, commit to git and create and merge pull request"
	NEW_BRANCH="dev-release/$NEXT_LOCAL_DEV_VERSION"
	git checkout -b $NEW_BRANCH
	echo "✅ Check out git branch ($NEW_BRANCH)"

	git add -u
	git commit -m "Bump to next $NEXT_LOCAL_DEV_VERSION_TYPE: ($NEXT_LOCAL_DEV_VERSION)"
	echo "✅ Commit to GitHub repository ($NEW_BRANCH)"
	git push --follow-tags
 	echo "✅ Pushed commit to GitHub repository"
	
	NEXT_LOCAL_DEV_VERSION=$(node -p "require('./package.json').version")
	echo "✅ Bumped local version to next $NEXT_LOCAL_DEV_VERSION_TYPE: $NEXT_LOCAL_DEV_VERSION"

	# Create pull request in GitHub
	echo_title "Create pull request in GitHub"
	PR_URL=`gh pr create --base "$MAIN_BRANCH" --head "$NEW_BRANCH" --title "New dev release: $NEXT_LOCAL_DEV_VERSION" --body "Updates NPM package version number" -a @me`
	echo "✅ Created pull request: $PR_URL"

	sleep 15
 
 	# Merge pull request
  	echo_title "Merge pull request"
   	gh pr merge "$PR_URL" --admin --squash --delete-branch
        echo "✅ Merged pull request"
fi
