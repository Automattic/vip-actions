#!/bin/sh

export NEW_RELIC_API_KEY=dummy_key
export NEW_RELIC_REGION=${NEW_RELIC_REGION}
export NEW_RELIC_LICENSE_KEY=${NEW_RELIC_INGEST_LICENSE_KEY}

export GH_EVENT=${GITHUB_EVENT_TYPE}
export GH_BRANCH=${GITHUB_EVENT_BRANCH}
export GH_PROJECT=${GITHUB_REPOSITORY}
export GH_SHA=${GITHUB_SHA}
export GH_PR_NUMBER=${GITHUB_PR_NUMBER}

# adding attributes to XML to correlate the test run with the CI.
xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "github_event_type" -v "$GH_EVENT" ${NEW_RELIC_TEST_OUTPUT_PATH}

xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "github_trigger_branch" -v "$GH_BRANCH" ${NEW_RELIC_TEST_OUTPUT_PATH}

xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "github_repository" -v "$GH_PROJECT" ${NEW_RELIC_TEST_OUTPUT_PATH}

xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "github_commit" -v "$GH_SHA" ${NEW_RELIC_TEST_OUTPUT_PATH}

xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
  --type attr -n "github_pr_number" -v "$GH_PR_NUMBER" ${NEW_RELIC_TEST_OUTPUT_PATH}

# Add PR URL if it's a PR
if [[ $GH_EVENT == "pull_request" ]]; then
  GH_PR_URL="https://github.com/${GH_PROJECT}/pulls/${GH_PR_NUMBER}"

  xmlstarlet ed -O --inplace --insert "/testsuites/testsuite/testcase" \
    --type attr -n "github_pr_url" -v "$GH_PR_URL" ${NEW_RELIC_TEST_OUTPUT_PATH}
fi

# use newrelic cli to send the junit report to newrelic
result=$(newrelic reporting junit \
  --accountId "${NEW_RELIC_ACCOUNT_ID}" \
  --path "${NEW_RELIC_TEST_OUTPUT_PATH}" \
  2>&1)

exitStatus=$?

if [ $exitStatus -ne 0 ]; then
  echo "::error:: $result"
fi

exit $exitStatus