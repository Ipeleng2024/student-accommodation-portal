async function loadCards() {
  const res = await fetch('/api/public/properties');
  const data = await res.json();

  for (const property of data.properties) {
    const slug = property.gallerySlug || property.id;
    await initGallery(property.id, slug, property.name);

    const perksEl = document.getElementById(`perks-${property.id}`);
    if (perksEl) {
      perksEl.innerHTML = property.amenities
        .map((a) => `<li class="perk-item"><span class="perk-icon">&#10003;</span>${a}</li>`)
        .join('');
    }
  }
}

loadCards();