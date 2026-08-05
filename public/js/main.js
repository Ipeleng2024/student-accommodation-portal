function roomPlaceholderImage(roomId) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><rect width='56' height='56' fill='%23EDF1F5'/><text x='28' y='32' font-family='monospace' font-size='10' fill='%236B7280' text-anchor='middle'>${roomId}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

async function loadSummary() {
  const res = await fetch('/api/public/summary');
  const data = await res.json();

  document.getElementById('stat-available').textContent = data.availableRooms;
  document.getElementById('stat-total').textContent = data.totalRooms;

  const board = document.getElementById('room-board');
  board.innerHTML = '';

  data.board.forEach((property) => {
    property.rooms.forEach((room) => {
      const tile = document.createElement('a');
      tile.href = `#${property.id}`;
      tile.className = `room-tile ${room.status}`;
      tile.title = `${property.name} - ${room.id} - ${room.status}`;
      tile.textContent = room.id.split('-')[1] || room.id;
      board.appendChild(tile);
    });
  });
}

async function loadProperties() {
  const res = await fetch('/api/public/properties');
  const data = await res.json();
  const main = document.getElementById('properties');
  main.innerHTML = '';

  for (const property of data.properties) {
    const availableCount = property.rooms.filter((r) => r.status === 'available').length;
    const slug = property.gallerySlug || property.id;

    const section = document.createElement('section');
    section.className = 'property';
    section.id = property.id;

    section.innerHTML = `
      <div class="property-head">
        <h2>${property.name}</h2>
        <span class="property-area">${property.area} - ${availableCount} open</span>
      </div>

      <div class="gallery-carousel" data-gallery="${property.id}">
        <img class="gallery-img" id="gallery-img-${property.id}" src="" alt="${property.name}" />
        <button class="gallery-nav gallery-prev" data-target="${property.id}" aria-label="Previous photo" style="display:none;">&#8592;</button>
        <button class="gallery-nav gallery-next" data-target="${property.id}" aria-label="Next photo" style="display:none;">&#8594;</button>
      </div>

      <p class="property-desc">${property.description}</p>

      <ul class="perks-list">
        ${property.amenities.map((a) => `<li class="perk-item"><span class="perk-icon">&#10003;</span>${a}</li>`).join('')}
      </ul>

      <table class="rooms-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Room</th>
            <th>Type</th>
            <th>Price / month</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${property.rooms
            .map(
              (r) => `
            <tr>
              <td><img class="room-photo" src="/${r.image}" alt="${r.id}" onerror="this.src='${roomPlaceholderImage(r.id)}'" /></td>
              <td>${r.id}</td>
              <td>${r.type}</td>
              <td>R${r.priceMonthly.toLocaleString()}</td>
              <td><span class="status-pill ${r.status}">${r.status}</span></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;

    main.appendChild(section);
    await initGallery(property.id, slug, property.name);
  }
}

loadSummary();
loadProperties();