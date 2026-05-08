let map;
let congregationsLayer;
let boundaryLayer;
let congregationsData = [];

async function loadGeoJSON(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Failed to load ${filePath}`);
  return response.json();
}

function initMap() {
  map = L.map('map').setView([-1.345, -48.380], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  loadData();
}

async function loadData() {
  try {
    const [congregacoes, limiteData] = await Promise.all([
      loadGeoJSON('data/congregacoes.geojson'),
      loadGeoJSON('data/limite_campo.geojson')
    ]);

    congregationsData = congregacoes.features;
    renderBoundary(limiteData);
    renderMarkers();
    updateStats();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Erro ao carregar dados. Verifique se os arquivos GeoJSON estão corretos.');
  }
}

function renderBoundary(data) {
  if (boundaryLayer) map.removeLayer(boundaryLayer);

  boundaryLayer = L.geoJSON(data, {
    style: {
      color: '#667eea',
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 5',
      fillOpacity: 0.05,
    }
  }).addTo(map);
}

function renderMarkers() {
  if (congregationsLayer) map.removeLayer(congregationsLayer);

  congregationsLayer = L.featureGroup();

  congregationsData.forEach(feature => {
    const { geometry, properties } = feature;
    const [lng, lat] = geometry.coordinates;

    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#667eea',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    });

    marker.bindPopup(createPopup(properties, lat, lng));
    congregationsLayer.addLayer(marker);
  });

  congregationsLayer.addTo(map);
}

function createPopup(properties, lat, lng) {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="popup-title">${properties.Name}</div>
    <div class="popup-info">${properties.PopupInfo || ''}</div>
    <div class="popup-coordinates">
      ${lat.toFixed(6)}, ${lng.toFixed(6)}
    </div>
    <div class="popup-actions">
      <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" class="action-btn btn-waze">
        📍 Abrir no Waze
      </a>
      <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="action-btn btn-gmaps">
        🗺️ Google Maps
      </a>
      <button class="action-btn btn-copy" onclick="copyCoordinates('${lat}', '${lng}')">
        📋 Copiar Coordenadas
      </button>
    </div>
  `;
  return div;
}

function copyCoordinates(lat, lng) {
  const text = `${lat}, ${lng}`;
  navigator.clipboard.writeText(text).then(() => {
    alert('Coordenadas copiadas!');
  });
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', filterMarkers);
}

function filterMarkers() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.toLowerCase();

  congregationsLayer.eachLayer(marker => {
    const feature = congregationsData.find(f => {
      const [lng, lat] = f.geometry.coordinates;
      return marker.getLatLng().lat === lat && marker.getLatLng().lng === lng;
    });

    if (feature && feature.properties.Name.toLowerCase().includes(query)) {
      marker.setStyle({ opacity: 1, fillOpacity: 0.8 });
    } else {
      marker.setStyle({ opacity: 0.2, fillOpacity: 0.1 });
    }
  });
}

function updateStats() {
  const statsValue = document.querySelector('.stats-value');
  if (statsValue) {
    statsValue.textContent = congregationsData.length;
  }
}

document.addEventListener('DOMContentLoaded', initMap);
