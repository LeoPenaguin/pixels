// Conventional Commits: `type(scope): subject`, e.g. `feat(web): add minimap drag`.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'server', 'e2e', 'deps', 'repo']],
  },
}
