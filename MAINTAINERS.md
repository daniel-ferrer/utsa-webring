# Maintainers

## Current maintainers

| GitHub | Role | Expected graduation |
|---|---|---|
| [@daniel-ferrer](https://github.com/daniel-ferrer) | Founder, owner | _TBD_ |

The goal is at least two active maintainers with different graduation years. If there are fewer, add a
"looking for maintainers" note to the README and pin an issue.

## Infrastructure

Keep this table current; it's what the next maintainer needs.

| Thing | Where | Who has access | Notes |
|---|---|---|---|
| Repository | GitHub, `daniel-ferrer/utsa-webring` | @daniel-ferrer | Consider moving to a GitHub organization so ownership can be shared. `main` is protected by a ruleset: PR, Code Owner review and the CI check required; repository admins can bypass. |
| Hosting | Cloudflare Pages project `utsa-webring` | @daniel-ferrer | Builds `main` with `npm run build`, publishes `dist/`. Fallback address: https://utsa-webring.pages.dev |
| DNS | Cloudflare zones `utsa-webring.com` and `utsa-webring.dev` | @daniel-ferrer | Redirect Rules: `www` → apex on `.com`; everything on `.dev` → `https://utsa-webring.com` (the `.dev` zone has proxied `AAAA 100::` placeholder records for `@` and `www`) |
| Domains | Porkbun (registrar) | @daniel-ferrer | Both `utsa-webring.com` and `utsa-webring.dev` renew on 2027-11-11. Keep auto-renew on, and prepay `.com` for several years. |
| Email | Porkbun email forwarding | @daniel-ferrer | `report@utsa-webring.com` forwards to the maintainers' inbox. The `.com` zone's MX (`fwd1`/`fwd2.porkbun.com`) and SPF records must stay; don't enable Cloudflare Email Routing, which replaces them. |

Every member's prev/next links point at `utsa-webring.com`, so **the `.com` domain must never lapse.** Keep
auto-renew on and prepay several years.

Keep these Cloudflare features **off** for the zone: Rocket Loader, Email Address Obfuscation, and automatic
Web Analytics injection. They inject scripts that the site's Content Security Policy blocks.

GitHub disables scheduled workflows in public repositories after 60 days without repository activity. If the
`Link check` workflow shows as disabled under **Actions**, re-enable it there.

## Reviewing a join pull request

1. CI is green (schema, append-only order, HTML, accessibility). CI checks member data with the validator from
   `main`, and rejects pull requests that change `data/members.json` together with other files.
2. The verification link plausibly shows a UTSA affiliation and matches the name. Lean toward including people.
3. The major is in a tech field (see [CONTRIBUTING.md](CONTRIBUTING.md#who-can-join)).
4. The site loads, is the member's own, has real content (not an untouched template), and follows the
   [content policy](CONTENT_POLICY.md). Skim the homepage and main navigation.
5. The job summary's "Member changes" table looks fine: the site responds, and links back if they've added the links.
6. Squash-merge with the title `join: <name>`, and thank them with a link to the [join page](https://utsa-webring.com/join/)
   for their prev/next links.

Aim to respond within 7 days. Close pull requests that have waited 14 days for the author, with a friendly note.

For a join request opened with the issue form, create the entry yourself in a pull request that says `Closes #<issue>`.

## Moderation

- On a credible report, remove the entry immediately in a pull request, then let the member know.
- Removal requests from members are handled within 7 days, no questions asked.
- Never discuss a sensitive private report in a public issue.

## Dead links

The `Link check` workflow runs twice a week and keeps one issue labeled `dead-links` up to date. A site is listed
after failing two checks in a row.

1. Ping the member on their original pull request or issue.
2. If the site is still down 30 days after first being listed, remove the entry in a pull request titled
   `remove: <name> (dead link)`. They can rejoin anytime.

Every quarter, open every member site and look for parked domains, spam or policy problems the link check can't catch.

## Handoff checklist

Start this the semester **before** you graduate.

- [ ] Recruit at least one maintainer who'll be at UTSA for 2+ more years. Review at least three join PRs together.
- [ ] Give them owner access to the repository (or the GitHub organization).
- [ ] Add them to the Cloudflare account (Pages, DNS, Email Routing) as an administrator.
- [ ] Transfer the domains or give them access to the registrar. Confirm auto-renew, payment method and expiry dates.
- [ ] Store recovery information in a shared password manager, not in one person's head.
- [ ] Update this file and `.github/CODEOWNERS`, and move yourself to "Emeritus".
- [ ] Announce the handoff in the README and community channels.

If nobody can take over: leave the site up, add an "adopt this project" note to the README, and keep the domain
prepaid as long as possible.

## Emeritus

_None yet._
