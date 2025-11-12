const map = L.map('map').setView([40.0150, -105.2705], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

const icon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const markers = [];

// Fetch and display locations from database
async function loadLocations() {
  try {
    const response = await fetch('/api/locations');
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      result.data.forEach(location => {
        const marker = L.marker([location.x_coord, location.y_coord], { icon })
          .addTo(map)
          .bindPopup(`
            <b>${location.username}</b><br>
            ${location.caption || 'No caption'}<br>
            <small>${new Date(location.date_created).toLocaleDateString()}</small>
          `);
        
        markers.push({
          id: location.post_id,
          marker,
          lat: location.x_coord,
          lng: location.y_coord,
          username: location.username,
          caption: location.caption
        });
      });
      
      updatePinList();
      
      // Center map on first location if available
      if (result.data.length > 0) {
        map.setView([result.data[0].x_coord, result.data[0].y_coord], 10);
      }
    }
  } catch (error) {
    console.error('Error loading locations:', error);
  }
}

function updatePinList() {
  const pinList = document.getElementById('pin-list');
  if (!pinList) return;
  
  pinList.innerHTML = '';
  
  markers.forEach((markerData, index) => {
    if (markerData) {
      const pinItem = document.createElement('div');
      pinItem.className = 'pin-item';
      pinItem.innerHTML = `
        <small><strong>${markerData.username}</strong>: ${markerData.caption || 'No caption'}</small>
      `;
      pinList.appendChild(pinItem);
    }
  });
  
  if (markers.length === 0) {
    pinList.innerHTML = '<small class="text-muted">No locations yet</small>';
  }
}

// Load locations when page loads
loadLocations();

