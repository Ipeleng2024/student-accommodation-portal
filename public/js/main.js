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
      tile.title = `${property.name} · ${room.id} · ${room.status}`;
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

  data.properties.forEach((property) => {
    const availableCount = property.rooms.filter((r) => r.status === 'available').length;

    const section = document.createElement('section');
    section.className = 'property';
    section.id = property.id;

    section.innerHTML = `
      <div class="property-head">
        <h2>${property.name}</h2>
        <span class="property-area">${property.area} · ${availableCount} open</span>
      </div>
      <p class="property-desc">${property.description}</p>
      <ul class="amenities">
        ${property.amenities.map((a) => `<li>${a}</li>`).join('')}
      </ul>
      <table class="rooms-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Floor</th>
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
              <td>${r.id}</td>
              <td>${r.floor}</td>
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
  });
}

loadSummary();
loadProperties();
