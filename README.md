# utsa-webring

A webring for UTSA students and alumni working in tech. Personal sites, portfolios and blogs, linked in a loop:
every member links to the next, and the last links back to the first.

**[utsa-webring.com](https://utsa-webring.com)** · [Join](https://utsa-webring.com/join/) · [Content policy](CONTENT_POLICY.md)

> Community-run and unofficial. Not affiliated with, sponsored, or endorsed by The University of Texas at San Antonio.

## What's a webring?

A webring is a group of websites linked together in a circle around a shared theme. They were everywhere on the
90s web. This one makes it easier to find the sites of people from UTSA, and sends a little traffic to each of them.

## Join

You can join if you're a current UTSA student or alum (any degree level) in a tech field, and you have your own
personal site. There are two ways:

- **Pull request:** add your entry to the end of [`data/members.json`](data/members.json).
- **No Git:** fill out the [join form](https://github.com/daniel-ferrer/utsa-webring/issues/new?template=join.yml).

Step-by-step instructions are on the [join page](https://utsa-webring.com/join/) and in [CONTRIBUTING.md](CONTRIBUTING.md).
Then add the prev/next links to your site:

```html
<nav aria-label="utsa-webring">
  <a href="https://utsa-webring.com/your-id/prev">← prev</a>
  <a href="https://utsa-webring.com/">utsa-webring</a>
  <a href="https://utsa-webring.com/your-id/next">next →</a>
</nav>
```

## How it works

- `data/members.json` is the only source of truth. Array order is ring order, so new members are appended.
- `scripts/build.mjs` validates the data and generates a static site in `dist/`:
  - the homepage, including the "living loop" diagram drawn from the member list,
  - `/<id>/next` and `/<id>/prev` as real redirects in a Cloudflare Pages `_redirects` file,
  - `/random/`, the join page, a 404 page, and `/members.json` for anyone who wants to build on the data.
- The site is plain HTML, CSS and a little JavaScript. It works without JavaScript, has no trackers or third-party
  requests, and is served with a strict Content Security Policy (`src/static/_headers`).
- CI validates every pull request (schema, append-only order, HTML, accessibility) and reports whether new member
  sites respond and link back. A scheduled job checks every member site twice a week and keeps a single
  "Dead links report" issue up to date.

## Development

Requires Node.js 22 or newer (see `.nvmrc`).

```sh
npm ci
npm run dev           # build with sample data and serve at http://127.0.0.1:8080
npm test              # unit tests
npm run check         # tests, data validation, build and HTML validation
```

Preview the loop at a larger size with generated members:

```sh
node scripts/build.mjs --fake 150 && npm run serve
```

The social preview image (`src/assets/img/og-image.png`) is rendered by `scripts/og-image.mjs` with headless Chrome
and committed. After changing its design, regenerate it with `npm run og-image` (add `-- --chrome <path>` or set
`CHROME_PATH` if Chrome is not found).

| Path | Contents |
|---|---|
| `data/` | `members.json` and its JSON Schema |
| `src/templates/` | Page templates |
| `src/assets/` | CSS, JavaScript, fonts and images |
| `src/static/` | Files copied as-is to the site root (`_headers`, `robots.txt`) |
| `scripts/` | Build, validation, local server and link checking |
| `test/` | Unit tests and sample data |

Deployment: Cloudflare Pages builds `main` with `npm run build` and publishes `dist/`.

## Credits

- Inspired by and adapted from the [SE Webring](https://github.com/simcard0000/se-webring) by Simran Thind and
  Janakitti Ratana-Rueangsri (MIT).
- Fonts: [Fraunces](https://github.com/undercasetype/Fraunces) and
  [Work Sans](https://github.com/weiweihuanghuang/Work-Sans), both under the SIL Open Font License
  (see `src/assets/fonts/`).

## License

Code is released under the [MIT License](LICENSE). Entries in `data/members.json` are contributed by members,
published with their consent, and removed on request.
