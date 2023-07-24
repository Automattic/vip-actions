#!/usr/bin/env bash

set -o errexit   # exit on error
set -o errtrace  # exit on error within function/sub-shell
set -o nounset   # error on undefined vars
set -o pipefail  # error if piped command fails

# Default variables
NPM_VERSION_TYPE=
MAIN_BRANCH="$(LC_ALL=C git remote show origin | awk '/HEAD branch/ {print $NF}')"
RELEASE_BRANCH="$MAIN_BRANCH"

echo_title() {
	echo ""
	echo "== $1 =="
}

while getopts ":t:b:" option;
do
	case $option in
		# npm major/minor/patch
		t) NPM_VERSION_TYPE=$OPTARG ;;
  
		# release branch
		b) [ -n "$OPTARG" ] && RELEASE_BRANCH=$OPTARG ;;
  
		\?) echo "Error: Invalid param / option specified"
			exit 199 ;;
   esac
done

# Validate release type value
if [ "$NPM_VERSION_TYPE" != "major" ] && [ "$NPM_VERSION_TYPE" != "minor" ] && [ "$NPM_VERSION_TYPE" != "patch" ]; then
	echo "❌ Invalid release type specified. Please make sure the -t flag is one of major/minor/patch."
	exit 200
fi

# Fetch some basic package information
echo_title "Fetching local package info"
LOCAL_NAME=$(node -p "require('./package.json').name")
LOCAL_VERSION=$(node -p "require('./package.json').version")
LOCAL_BRANCH=$(git branch --show-current)
REMOTE_VERSION=$(npm view "$LOCAL_NAME" version)
echo "✅ Found $LOCAL_NAME $LOCAL_VERSION on branch $LOCAL_BRANCH"
echo "✅ Published version is $REMOTE_VERSION"
echo "✅ Will prepare new $NPM_VERSION_TYPE release"

# Validate current branch
echo_title "Checking branch"
if [ "$LOCAL_BRANCH" != "$RELEASE_BRANCH" ]; then
	echo "❌ You can only publish from the '$RELEASE_BRANCH' branch. Please switch branches and try again."
	exit 201
fi
echo "✅ On a valid release branch ($LOCAL_BRANCH)"

# Validate no uncommitted changes.
# Shouldn't happen in CI but protects against local runs.
echo_title "Checking for local changes"
if ! git diff-index --quiet HEAD --; then
	echo "❌ Working directory has uncommitted changes; please clean up before proceeding."
	exit 202
fi
echo "✅ No local changes found"

# Install
echo_title "npm ci + test"

# Install dependencies but skip pre/post scripts since our auth token is in place
npm ci --ignore-scripts

# npm version bump (no commit)
echo_title "npm version (no git commit nor tag)"
NEW_VERSION=$( npm --no-git-tag-version  version "$NPM_VERSION_TYPE" )
echo "✅ Bumped version to $NEW_VERSION (no commit)"

# Checkout branch for release
echo_title "git checkout branch"
NEW_BRANCH="release/$NPM_VERSION_TYPE--$RELEASE_BRANCH--$NEW_VERSION-$RANDOM"
git checkout -b $NEW_BRANCH
echo "✅ Checked out git branch ($NEW_BRANCH)"

# git commit
echo_title "git commit"
git commit -a -m "Commiting new version of package"
echo "✅ Commit new version of package to git branch"

# git push
echo_title "push to GitHub, create/verify label and create pull request"

git push --set-upstream origin $NEW_BRANCH
echo "✅ Pushed version bump to GitHub"

LABEL='[ Type ] NPM version update'
gh label create "$LABEL" --color '#C2E0C6' --force
echo "✅ Created/updated label ($LABEL) in GitHub"

# Create pull request in GitHub
echo_title "Create pull request in GitHub"

PR_URL=`gh pr create --base $RELEASE_BRANCH --head $NEW_BRANCH --title "New package release: $NEW_VERSION" --body $'## Description \n\n<p>This pull request updates the npm package version number and can be merged when suitable. Merging will automatically trigger publishing to npm (if everything is correctly set up).</p>' --label "$LABEL" --assignee "$PR_ASSIGNEE"`
echo "✅ Created pull request: $PR_URL"
