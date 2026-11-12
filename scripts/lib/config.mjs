/** Site-wide constants shared by the build and the maintenance scripts. */
export const SITE = Object.freeze({
  name: 'utsa-webring',
  url: 'https://utsa-webring.com',
  repoUrl: 'https://github.com/daniel-ferrer/utsa-webring',
  description:
    'A student-run webring of personal sites by UTSA students and alumni in tech. ' +
    'Unofficial; not affiliated with The University of Texas at San Antonio.',
  disclaimer:
    'Student-run and unofficial. Not affiliated with, sponsored, or endorsed by ' +
    'The University of Texas at San Antonio.',
});

/** Cloudflare Pages allows at most 2,000 static rules in _redirects. */
export const MAX_STATIC_REDIRECTS = 2000;
