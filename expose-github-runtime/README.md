# Expose GitHub Runtime

This action exposes GitHub runtime to the workflow.

This is required if the workflow runs a script that needs to access the GitHub API (for example, upload an artifact or work with the cache). The script will need access to such variables as `ACTIONS_RUNTIME_TOKEN` or `ACTIONS_RUNTIME_URL`; they are normally exposed to the actions, not to the scripts.

#### Example

```yaml
name: My Workflow
on:
  push:
    branches:
      - master

jobs:
  expose-runtime:
    runs-on: ubuntu-latest
    steps:
      - uses: Automattic/vip-actions/expose-github-runtime@trunk
      - run: env | grep ACTIONS_
      # Say, you need to build a Docker image and reuse action cache; the 'type=gha' needs the GitHub runtime
      - run: docker buildx build -t "ghcr.io/repo/image:latest" --cache-from type=gha --cache-to type=gha,mode=max .
```
