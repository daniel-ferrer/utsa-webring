# Security policy

utsa-webring is a static site: there are no accounts, no server-side code and no stored personal data beyond the
public entries in `data/members.json`.

## Reporting a vulnerability

Please report security problems privately through
[GitHub's private vulnerability reporting](https://github.com/daniel-ferrer/utsa-webring/security/advisories/new),
not in a public issue. Examples:

- A way to inject script or markup into the site through member data
- A problem with the GitHub Actions workflows (for example, a way for a pull request to gain write access)
- A misconfiguration of the site's security headers or redirects (for example, an open redirect)

A maintainer will respond within 7 days. This is a community-run project with no bug bounty.

A member site that becomes malicious isn't a vulnerability in this project. Use the
[content policy](CONTENT_POLICY.md) reporting process instead.
