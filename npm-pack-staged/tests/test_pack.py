import importlib.util
import io
import json
import os
import shutil
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('validator', ROOT / 'bin/validate.py')
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class StagedPackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='npm staging test ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.output = self.root / 'output'
        self.source.mkdir()
        self.output.mkdir()
        self.manifest = {
            'name': 'staging-fixture', 'version': '1.0.0',
            'dependencies': {'native-fixture': '1.0.0'},
            'bundleDependencies': True,
            'scripts': {
                'prepublishOnly': 'node -e "if(process.env.npm_config_tag!==\'next\')process.exit(1)"',
                'prepare': 'node prepare.js',
                'postpack': 'node -e "require(\'fs\').writeFileSync(\'built.txt\',\'changed-after-pack\')"',
                'smoke': 'node smoke.js',
                'test': 'node smoke.js',
            },
        }
        (self.source / 'package.json').write_text(json.dumps(self.manifest))
        dep = self.source / 'node_modules/native-fixture'
        dep.mkdir(parents=True)
        (dep / 'package.json').write_text(json.dumps({'name': 'native-fixture', 'version': '1.0.0'}))
        (self.source / 'prepare.js').write_text('''
const fs = require('fs');
const dir = 'node_modules/native-fixture/';
fs.writeFileSync('built.txt', 'built-before-copy');
fs.writeFileSync(dir + 'original.node', 'native-bytes');
fs.chmodSync(dir + 'original.node', 0o755);
if (fs.existsSync(dir + 'copy.node')) fs.unlinkSync(dir + 'copy.node');
fs.linkSync(dir + 'original.node', dir + 'copy.node');
''')
        (self.source / 'smoke.js').write_text('''
const fs = require('fs');
if (fs.readFileSync('built.txt', 'utf8') !== 'built-before-copy') process.exit(1);
if (fs.readFileSync('node_modules/native-fixture/copy.node', 'utf8') !== 'native-bytes') process.exit(1);
if (process.env.NODE_AUTH_TOKEN) process.exit(1);
''')
        self.env = {**os.environ, 'HOME': str(self.root), 'NODE_AUTH_TOKEN': 'must-not-reach-hooks',
                    'NPM_CONFIG_USERCONFIG': os.devnull, 'NPM_CONFIG_CACHE': str(self.root / 'cache'),
                    'NPM_CONFIG_REGISTRY': 'http://127.0.0.1:9', 'TMPDIR': str(self.root)}

    def pack(self, smoke='smoke'):
        return subprocess.run(['bash', str(ROOT / 'bin/pack.sh'), str(self.source), str(self.output),
                               'next', smoke], env=self.env, text=True, capture_output=True)

    def test_copies_links_and_smokes_exact_archive_without_rebuilding(self):
        result = self.pack()
        self.assertEqual(result.returncode, 0, result.stderr)
        archive = Path(result.stdout.strip())
        self.assertEqual(archive.parent, self.output.resolve())
        with tarfile.open(archive) as package:
            self.assertFalse(any(m.islnk() or m.issym() for m in package))
            for name in ['original.node', 'copy.node']:
                member = package.getmember('package/node_modules/native-fixture/' + name)
                self.assertTrue(member.isfile())
                self.assertEqual(member.mode & 0o777, 0o755)
                self.assertEqual(package.extractfile(member).read(), b'native-bytes')
            self.assertEqual(package.extractfile('package/built.txt').read(), b'built-before-copy')
        dep = self.source / 'node_modules/native-fixture'
        self.assertEqual((dep / 'original.node').stat().st_ino, (dep / 'copy.node').stat().st_ino)
        self.assertEqual((self.source / 'built.txt').read_text(), 'changed-after-pack')
        self.assertEqual(list(self.root.glob('npm-pack-staged.*')), [])

    def test_hook_failure_does_not_produce_an_artifact(self):
        self.manifest['scripts']['prepublishOnly'] = 'node -e "process.exit(7)"'
        (self.source / 'package.json').write_text(json.dumps(self.manifest))
        self.assertNotEqual(self.pack().returncode, 0)
        self.assertEqual(list(self.output.iterdir()), [])

    def test_smoke_failure_does_not_produce_an_artifact(self):
        (self.source / 'smoke.js').write_text('process.exit(8)')
        self.assertNotEqual(self.pack().returncode, 0)
        self.assertEqual(list(self.output.iterdir()), [])
        self.assertEqual(list(self.root.glob('npm-pack-staged.*')), [])

    def test_output_inside_source_is_rejected(self):
        self.output = self.source
        result = self.pack()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('outside the source', result.stderr)

    def test_existing_artifact_is_not_overwritten(self):
        artifact = self.output / 'staging-fixture-1.0.0.tgz'
        artifact.write_bytes(b'keep-me')
        self.assertNotEqual(self.pack().returncode, 0)
        self.assertEqual(artifact.read_bytes(), b'keep-me')

    def test_stable_and_prerelease_publish_the_exact_dry_run_artifact(self):
        commands = self.root / 'commands'
        commands.mkdir()
        real_npm = shutil.which('npm')
        for name, body in {
            'git': '#!/bin/sh\ncase "$1" in branch) echo trunk ;; fetch|checkout|diff-index) ;; *) exit 9 ;; esac\n',
            'gh': '#!/bin/sh\nif [ "$1 $2" = "pr diff" ]; then echo package.json; fi\n',
            'npm': r'''#!/usr/bin/env python3
import hashlib, json, os, subprocess, sys, tarfile
args = sys.argv[1:]
if args[0] == 'view':
    print('0.9.0')
elif args[0] in ('ci', 'rebuild'):
    pass
elif args[0] == 'publish':
    artifact = args[1]
    assert artifact.endswith('.tgz'), args
    assert '--ignore-scripts' in args, args
    with tarfile.open(artifact) as t:
        assert not any(m.islnk() or m.issym() for m in t)
    with open(artifact, 'rb') as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    with open(os.environ['PUBLISH_LOG'], 'a') as f:
        f.write(json.dumps({'args': args, 'sha256': digest}) + '\n')
else:
    sys.exit(subprocess.call([os.environ['REAL_NPM'], *args]))
''',
        }.items():
            script = commands / name
            script.write_text(body)
            script.chmod(0o755)
        # The stable action supplies latest; test the prerelease tag independently.
        self.manifest['scripts']['prepublishOnly'] = 'node -e "if(process.env.NODE_AUTH_TOKEN)process.exit(1)"'
        (self.source / 'package.json').write_text(json.dumps(self.manifest))
        for action in ['npm-publish', 'npm-publish-prerelease']:
            with self.subTest(action=action):
                log = self.root / (action + '.jsonl')
                env = {**self.env, 'PATH': str(commands) + os.pathsep + os.environ['PATH'],
                       'REAL_NPM': real_npm, 'PUBLISH_LOG': str(log), 'CI': 'true',
                       'GITHUB_ACTIONS': 'true', 'PROVENANCE': 'true',
                       'USE_TRUSTED_PUBLISHING': 'true', 'STAGE_PACKAGE': 'true',
                       'SMOKE_SCRIPT': 'smoke', 'SKIP_BUMP_TO_DEV': 'true',
                       'PR_HEAD_REF': 'release/patch--trunk', 'PR_NUMBER': '1', 'NPM_TAG': 'next'}
                result = subprocess.run(['bash', str(ROOT.parent / action / 'bin/publish.sh')],
                                        cwd=self.source, env=env, text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                calls = [json.loads(line) for line in log.read_text().splitlines()]
                self.assertEqual(len(calls), 2)
                self.assertEqual(calls[0]['args'][1], calls[1]['args'][1])
                self.assertEqual(calls[0]['sha256'], calls[1]['sha256'])
                self.assertIn('--dry-run', calls[0]['args'])
                self.assertNotIn('--dry-run', calls[1]['args'])
                self.assertIn('--provenance', calls[1]['args'])
                self.assertFalse(Path(calls[1]['args'][1]).exists(), 'temporary artifact must be cleaned')

    def test_validator_rejects_unsafe_archives(self):
        for name, kind, identity in [
            ('package/hard.node', tarfile.LNKTYPE, self.manifest),
            ('package/soft.node', tarfile.SYMTYPE, self.manifest),
            ('package/../escape', tarfile.REGTYPE, self.manifest),
            ('/absolute', tarfile.REGTYPE, self.manifest),
            ('package/device', tarfile.CHRTYPE, self.manifest),
            ('package/package.json', tarfile.REGTYPE, self.manifest),
            ('package/safe', tarfile.REGTYPE, {'name': 'wrong', 'version': '1.0.0'}),
        ]:
            with self.subTest(name=name, kind=kind):
                archive = self.output / 'bad.tgz'
                with tarfile.open(archive, 'w:gz') as package:
                    data = json.dumps(identity).encode()
                    manifest = tarfile.TarInfo('package/package.json')
                    manifest.size = len(data)
                    package.addfile(manifest, io.BytesIO(data))
                    entry = tarfile.TarInfo(name)
                    entry.type = kind
                    if kind in (tarfile.LNKTYPE, tarfile.SYMTYPE):
                        entry.linkname = 'package/package.json'
                    package.addfile(entry)
                with self.assertRaises(ValueError):
                    validator.validate(archive, self.source / 'package.json')


if __name__ == '__main__':
    unittest.main()
