#!/bin/sh

export NEW_RELIC_API_KEY=dummy_key
export NEW_RELIC_REGION=${NEW_RELIC_REGION}
export NEW_RELIC_LICENSE_KEY=${NEW_RELIC_INGEST_LICENSE_KEY}

export GH_EVENT=${GITHUB_EVENT_TYPE}
export GH_PROJECT=${GITHUB_REPOSITORY}
export GH_SHA=${GITHUB_SHA}
export GH_PR_NUMBER=${GITHUB_PR_NUMBER}

# adding attributes to XML to correlate the test run with the CI.
xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "repository" -v "$GH_PROJECT" ${NEW_RELIC_TEST_OUTPUT_PATH}

xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "commit" -v "$GH_SHA" ${NEW_RELIC_TEST_OUTPUT_PATH}

xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "event_type" -v "$GH_EVENT" ${NEW_RELIC_TEST_OUTPUT_PATH}

# Capture the branch name for PRs and other events
if [[ $GH_EVENT == "pull_request" ]]; then
  GH_HEAD_BRANCH=${GITHUB_PULL_REQUEST_HEAD_BRANCH}
  GH_BASE_BRANCH=${GITHUB_PULL_REQUEST_BASE_BRANCH}
  GH_PR_URL="https://github.com/${GH_PROJECT}/pulls/${GH_PR_NUMBER}"

  xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "trigger_branch" -v "$GH_HEAD_BRANCH" ${NEW_RELIC_TEST_OUTPUT_PATH}

  xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "base_branch" -v "$GH_BASE_BRANCH" ${NEW_RELIC_TEST_OUTPUT_PATH}

  xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "pr_number" -v "$GH_PR_NUMBER" ${NEW_RELIC_TEST_OUTPUT_PATH}

  xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
    --type attr -n "pr_url" -v "$GH_PR_URL" ${NEW_RELIC_TEST_OUTPUT_PATH}

else
  # For all other events, inclusing dispatches, we can assume the branch is the one that triggered the workflow
  GH_BRANCH=${GITHUB_PUSH_BRANCH}

  xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "trigger_branch" -v "$GH_BRANCH" ${NEW_RELIC_TEST_OUTPUT_PATH}
fi

# use newrelic cli to send the junit report to newrelic
result=$(newrelic reporting junit \
  --accountId "${NEW_RELIC_ACCOUNT_ID}" \
  --path "${NEW_RELIC_TEST_OUTPUT_PATH}" \
  2>&1)

exitStatus=$?

if [ $exitStatus -ne 0 ]; then
  echo "::error:: Unable to push results to New Relic. Exiting with: $result"
else
  echo "::success:: Successfully uploaded results to New Relic"
fi

exit $exitStatus
