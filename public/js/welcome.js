async function loadCards() {
  let data;

  try {
    const res = await fetch('/api/public/properties');
    data = await res.json();
  } catch (err) {
    return;
  }

  const fromEl = document.getElementById('welcome-from-price');
  const lowest = lowestPrice(data.properties);
  if (fromEl && lowest !== null) fromEl.textContent = formatMoney(lowest);

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