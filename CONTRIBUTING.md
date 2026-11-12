# Contributing

Thanks for helping out. Most contributions are people joining the ring; code and docs improvements are welcome too.

## Joining the ring

### Who can join

- Current UTSA students and alumni (graduated, or attended for at least one semester), at any degree level.
- Your major, minor or degree is in a tech field: computer science, computer engineering, cybersecurity, data
  science, AI/ML, information systems or technology, electrical engineering, statistics or math with a computing
  focus, or digital/UX design. If your site is mostly about technical work, you're in.
- The link is your own personal site: a portfolio, blog or digital garden. Not a company page, link-in-bio page or
  social profile.
- Your site follows the [content policy](CONTENT_POLICY.md).

### Option 1: pull request

1. Edit [`data/members.json`](data/members.json) (on GitHub, click the pencil icon; it forks the repo for you).
2. Add your entry at the **end** of the `members` list:

   ```json
   {
     "id": "your-name",
     "name": "Your Name",
     "gradYear": 2027,
     "major": "Computer Science",
     "website": "https://your-site.dev/",
     "joined": "2026-11-11"
   }
   ```

3. Open a pull request and fill in the template, including one public link that shows you're at UTSA.

Field rules (CI checks all of them):

| Field | Rule |
|---|---|
| `id` | Lowercase letters, numbers and single hyphens, 2–40 characters. Permanent: it's part of your prev/next links. |
| `name` | How you want your name shown. Nicknames are fine. |
| `gradYear` | Expected or actual graduation year. |
| `major` | Your major or field. |
| `degree` | Optional: `BS`, `BA`, `BBA`, `MS`, `MA`, `MBA`, `PhD` or `Other`. |
| `website` | `https://`, your own domain or a hosting subdomain, no query string or tracking parameters. A bare domain ends in `/` (`https://your-site.dev/`); CI tells you the exact form if it's off. |
| `joined` | Today's date, `YYYY-MM-DD`. |

Please don't reorder or edit other people's entries: ring order is join order, and CI will reject the change.
A pull request that changes `data/members.json` must not change any other file.

### Option 2: the join form

No Git needed: open the [join form](https://github.com/daniel-ferrer/utsa-webring/issues/new?template=join.yml)
and a maintainer will add you.

### After you're in

Add the prev/next links to your site. The [join page](https://utsa-webring.com/join/) generates them for your id.
They're plain links with no script, so they work on any host and track nobody.

### Updating or leaving

- **Moved to a new domain?** Edit only your own entry and open a pull request. Keep your `id`.
- **Leaving?** Open a [removal request](https://github.com/daniel-ferrer/utsa-webring/issues/new?template=remove.yml)
  or a pull request deleting your entry. No questions asked.

## Code and docs

```sh
npm ci
npm run dev      # sample data at http://127.0.0.1:8080
npm run check    # tests, validation, build and HTML validation; run before opening a PR
```

Guidelines:

- Keep the site static, fast and usable without JavaScript. No trackers, analytics or third-party requests.
- Escape all member-supplied text when rendering (see `scripts/lib/html.mjs`).
- Keep runtime dependencies at zero. Discuss new dev dependencies in an issue first.
- Meet WCAG 2.2 AA: visible focus, 4.5:1 text contrast in both themes, and respect `prefers-reduced-motion`.
- Add or update tests in `test/` for changes to `scripts/lib/`.
