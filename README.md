## *Conventional Commits
[https://www.conventionalcommits.org/en/v1.0.0/]

> [type][optional scope]: [description]



- **fix**: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
- **feat**: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
- **BREAKING CHANGE**: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.


### types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends
- build:,
- chore:,
- ci:,
- docs:,s
- style:,
- refactor:,
- perf:,
- test:,
- and others.


### Examples
- feat: allow provided config object to extend other configs
- feat(parser): add ability to parse arrays
- feat!: send an email to the customer when a product is shipped
- feat(lang): add Polish language
- fix: prevent racing of requests
