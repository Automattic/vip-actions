#!/usr/bin/env bash

set -o errexit   # exit on error
set -o errtrace  # exit on error within function/sub-shell
set -o nounset   # error on undefined vars
set -o pipefail  # error if piped command fails

# Default variables
NPM_VERSION_TYPE=
MAIN_BRANCH="$(LC_ALL=C git remote show origin | awk '/HEAD branch/ {print $NF}')"

# @todo: Temporary, remove
git fetch origin $MAIN_BRANCH
git checkout $MAIN_BRANCH

echo_title() {
	echo ""
	echo "== $1 =="
}

while getopts ":t:" option;
do
	case $option in
		# npm major/minor/patch
		t) NPM_VERSION_TYPE=$OPTARG ;;

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
echo "✅ Will publish new $NPM_VERSION_TYPE release"

# Validate npm is logged in and ready
echo_title "Checking npm auth"
if ! NPM_USER=$( npm whoami ); then
	echo "❌ npm cli is not authenticated. Please make sure you're logged in or NPM_TOKEN is set."
	exit 201
fi
echo "✅ Logged in as $NPM_USER and ready to publish"

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

# Install
echo_title "npm ci + test"

# Install dependencies but skip pre/post scripts since our auth token is in place
npm ci --ignore-scripts

# Run scripts + tests without auth token to prevent malicious access
NODE_AUTH_TOKEN= npm rebuild
NODE_AUTH_TOKEN= npm run prepare --if-present
NODE_AUTH_TOKEN= npm test
echo "✅ npm install + npm test look good"

# Publish with Dry Run
# @todo: Remove
#echo_title "npm publish (dry-run)"
#npm publish --access public --dry-run
#echo "✅ Dry run looks good"

# npm version bump (no commit)
echo_title "npm version (no git commit nor tag)"
NEW_VERSION=$( npm --no-git-tag-version  version "$NPM_VERSION_TYPE" )
echo "✅ Bumped version to $NEW_VERSION (no commit)"

# Checkout branch for release
echo_title "git checkout branch"
NEW_BRANCH="release/$NPM_VERSION_TYPE-$NEW_VERSION-$RANDOM"
git checkout -b $NEW_BRANCH
echo "✅ Check out git branch ($NEW_BRANCH)"

# git commit
echo_title "git commit"
git commit -m "Commiting new version of package" package.json
echo "✅ Commit new version of package to git branch"

# git push
echo_title "push to GitHub, create/verify label and create pull request"

git push --set-upstream origin $NEW_BRANCH
echo "✅ Pushed version bump to GitHub"

LABEL='[ Type ] NPM version update'
LABEL_CNT=`gh label list --search "$LABEL" | wc -l` ; echo 
if [ "$LABEL_CNT" == 0 ] ; then
	gh label create "$LABEL" --color '#C2E0C6'
	echo "✅ Created label ($LABEL) in GitHub"
else
	echo "✅ Verified that label exists ($LABEL)"
fi

# Create pull request in GitHub
echo_title "Create pull request in GitHub"
PR_URL=`gh pr create --base $LOCAL_BRANCH --head $NEW_BRANCH --title "New release: $NEW_VERSION" --body $'## Description \n\n<p>This pull request updates the npm package version number and should be auto-merged.</p>' --label "$LABEL" -a @me`
echo "✅ Created pull request: $PR_URL"
