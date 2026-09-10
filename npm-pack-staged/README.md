# Pack a staged npm artifact

Use after installing dependencies, building and testing the package. Requires
Node/npm, `rsync`, Python 3 and `tar` (available on GitHub-hosted Ubuntu runners).
This action never publishes.

The helper runs `prepublishOnly`, `prepack` and `prepare` in the source checkout
with the registry token cleared. It uses `rsync -a` **without `-H`** into a fresh
temporary directory, then packs with lifecycle scripts disabled. It validates
package identity and rejects links, duplicate paths and unsafe archive entries.
`postpack` runs in the source checkout after packing. Optional smoke tests run
inside an extraction of the validated archive; dependencies must be bundled for
these tests. Smoke tests must be non-mutating checks of the artifact.

`tarball` is an absolute path to the validated artifact under `RUNNER_TEMP`.
Publish that exact file with `npm publish "$TARBALL" --ignore-scripts` and the
appropriate tag/provenance flags. Do not rebuild, repack or publish the directory
after validation. Publishing the tarball intentionally does not run directory
`publish`/`postpublish` hooks; consumers needing those hooks should retain the
legacy publishing path until they move that work into explicit workflow steps.
The staging directory is always cleaned; the action's output remains for later
steps until the job's temporary directory is removed.

Both `npm-publish` and `npm-publish-prerelease` support `STAGE_PACKAGE: 'true'`
with optional `SMOKE_SCRIPT`. Their default remains the legacy directory publish
path so other consumers opt in explicitly. For VIP CLI, use `SMOKE_SCRIPT:
smoke:release`.

Run regression checks without registry access or publication:

```sh
python3 -m unittest discover -s npm-pack-staged/tests -v
shellcheck npm-pack-staged/bin/pack.sh npm-publish/bin/publish.sh npm-publish-prerelease/bin/publish.sh
```

Tests build real fixture tarballs and exercise both publisher scripts with
mocked publishing. They cover link flattening, preserved bytes and modes,
lifecycle ordering, smoke failures, archive rejection, and publishing the same
bytes used by the dry run.
