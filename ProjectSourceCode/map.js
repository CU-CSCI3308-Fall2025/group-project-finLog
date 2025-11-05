const map = L.map('map').setView([40.0150, -105.2705], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

const icons = {
  blue: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  green: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  gold: L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

const markers = [];

function addPin(lat, lng, type, title, description) {
  const icon = icons[type] || icons.blue;
  const marker = L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(`<b>${title}</b><br>${description}`);
  
  markers.push({ id: markers.length, marker, lat, lng, type, title, description });
  return markers.length - 1;
}

function removePin(id) {
  const markerData = markers[id];
  if (markerData && markerData.marker) {
    map.removeLayer(markerData.marker);
    markers[id] = null;
    return true;
  }
  return false;
}

function clearAllPins() {
  markers.forEach(markerData => {
    if (markerData && markerData.marker) {
      map.removeLayer(markerData.marker);
    }
  });
  markers.length = 0;
  updatePinList();
}

function updatePinList() {
  const pinList = document.getElementById('pin-list');
  pinList.innerHTML = '';
  
  markers.forEach((markerData, index) => {
    if (markerData) {
      const pinItem = document.createElement('div');
      pinItem.className = 'pin-item';
      pinItem.innerHTML = `
        <small><strong>${markerData.title}</strong></small>
        <button class="btn btn-sm btn-outline-danger" onclick="handleRemovePin(${index})">×</button>
      `;
      pinList.appendChild(pinItem);
    }
  });
  
  if (markers.filter(m => m).length === 0) {
    pinList.innerHTML = '<small class="text-muted">No pins added yet</small>';
  }
}

function handleRemovePin(id) {
  removePin(id);
  updatePinList();
}

map.on('click', function(e) {
  document.getElementById('pin-lat').value = e.latlng.lat.toFixed(4);
  document.getElementById('pin-lng').value = e.latlng.lng.toFixed(4);
});

document.getElementById('add-pin-btn').addEventListener('click', function() {
  const lat = parseFloat(document.getElementById('pin-lat').value);
  const lng = parseFloat(document.getElementById('pin-lng').value);
  const type = document.getElementById('pin-type').value;
  const title = document.getElementById('pin-title').value || 'Untitled';
  const desc = document.getElementById('pin-desc').value || 'No description';
  
  if (isNaN(lat) || isNaN(lng)) {
    alert('Please enter valid coordinates or click on the map');
    return;
  }
  
  addPin(lat, lng, type, title, desc);
  updatePinList();
  
  document.getElementById('pin-title').value = '';
  document.getElementById('pin-desc').value = '';
});

document.getElementById('clear-pins-btn').addEventListener('click', function() {
  if (confirm('Are you sure you want to remove all pins?')) {
    clearAllPins();
  }
});

addPin(40.0150, -105.2705, 'blue', 'Recent Catch', 'Rainbow Trout caught today');
addPin(40.0200, -105.2800, 'green', 'Best Fishing Spot', 'Excellent location for bass');
addPin(39.9900, -105.2600, 'gold', 'Explored Area', 'Good spot for beginners');

updatePinList();

