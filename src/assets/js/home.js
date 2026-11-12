// Homepage: member search/filters and the loop's entrance animation.
// The page is fully usable without this script; it only adds enhancements.

const ALUMNI_MONTH = 5; // June: spring graduates count as alumni from June on.

// Must match normalizeText() in scripts/lib/format.mjs, which builds data-search.
function normalize(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function isAlum(gradYear, now) {
  const year = now.getFullYear();
  return gradYear < year || (gradYear === year && now.getMonth() >= ALUMNI_MONTH);
}

function initFilters() {
  const filters = document.querySelector('[data-member-filters]');
  const list = document.querySelector('[data-member-list]');
  if (!filters || !list) return;

  const query = filters.querySelector('input[name="query"]');
  const year = filters.querySelector('select[name="year"]');
  const status = document.querySelector('[data-filter-status]');
  const empty = document.querySelector('[data-filter-empty]');
  const now = new Date();
  const members = Array.from(list.querySelectorAll('[data-member]'), (element) => ({
    element,
    text: element.dataset.search,
    year: Number(element.dataset.year),
    alum: isAlum(Number(element.dataset.year), now),
  }));

  const apply = () => {
    const terms = normalize(query.value).split(/\s+/).filter(Boolean);
    const group = filters.querySelector('input[name="group"]:checked').value;
    let shown = 0;

    for (const member of members) {
      const matches =
        terms.every((term) => member.text.includes(term)) &&
        (group === 'all' || (group === 'alumni') === member.alum) &&
        (year.value === '' || String(member.year) === year.value);
      member.element.hidden = !matches;
      if (matches) shown += 1;
    }

    const filtered = shown !== members.length;
    status.textContent = filtered ? `Showing ${shown} of ${members.length} members` : '';
    empty.hidden = shown !== 0;
  };

  filters.addEventListener('input', apply);
  filters.addEventListener('change', apply);
  filters.hidden = false;
  apply();
}

function animateLoop() {
  const loop = document.querySelector('[data-loop]');
  if (!loop || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const nodes = loop.querySelectorAll('.loop-node');
  const step = Math.min(60, 1200 / Math.max(nodes.length, 1));
  nodes.forEach((node, index) => node.style.setProperty('--delay', `${Math.round(index * step)}ms`));
  loop.classList.add('loop--animate');
}

initFilters();
animateLoop();
