// /random/: send the visitor to a random member site.

async function hop() {
  const response = await fetch('/members.json', { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`members.json returned ${response.status}`);

  const { members } = await response.json();
  if (members.length === 0) throw new Error('No members to pick from');

  const pick = members[Math.floor(Math.random() * members.length)];
  const target = new URL(pick.website);
  if (target.protocol !== 'https:') throw new Error('Refusing a non-https member URL');
  window.location.replace(target.href);
}

hop().catch(() => {
  document.querySelector('[data-random-fallback]').hidden = false;
});
