let map;
let congregationsLayer;
let boundaryLayer;
let congregationsData = [];
let currentBasemap = 'osm';

async function loadGeoJSON(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Failed to load ${filePath}`);
  return response.json();
}

const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
    className: 'basemap-osm'
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri',
    maxZoom: 18,
    className: 'basemap-satellite'
  }),
  topographic: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap & SRTM',
    maxZoom: 17,
    className: 'basemap-topo'
  }),
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap & CartoDB',
    maxZoom: 19,
    className: 'basemap-dark'
  })
};

function initMap() {
  map = L.map('map').setView([-1.345, -48.380], 14);
  basemaps.osm.addTo(map);

  const basemapControl = L.control({ position: 'bottomright' });
  basemapControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'basemap-switcher');
    div.innerHTML = `
      <div class="basemap-buttons">
        <button class="basemap-btn active" data-basemap="osm" title="OpenStreetMap">🗺️ Mapa</button>
        <button class="basemap-btn" data-basemap="satellite" title="Satélite">🛰️ Satélite</button>
        <button class="basemap-btn" data-basemap="topographic" title="Topográfico">⛰️ Topo</button>
        <button class="basemap-btn" data-basemap="dark" title="Escuro">🌙 Escuro</button>
      </div>
    `;
    div.addEventListener('click', e => {
      if (e.target.classList.contains('basemap-btn')) {
        const basemapName = e.target.dataset.basemap;
        switchBasemap(basemapName);
        document.querySelectorAll('.basemap-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      }
    });
    return div;
  };
  basemapControl.addTo(map);

  loadData();
  setupSearch();
  setupControls();
}

function switchBasemap(basemapName) {
  if (currentBasemap && basemaps[currentBasemap]) {
    map.removeLayer(basemaps[currentBasemap]);
  }
  if (basemaps[basemapName]) {
    basemaps[basemapName].addTo(map);
    currentBasemap = basemapName;
  }
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

    const icon = L.divIcon({
      html: `<div class="church-marker">⛪</div>`,
      className: 'church-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const marker = L.marker([lat, lng], { icon });
    marker.bindPopup(createPopup(properties, lat, lng));
    marker.on('click', function() {
      congregationsLayer.eachLayer(m => {
        if (m !== marker) {
          m.setOpacity(0.6);
        }
      });
      marker.setOpacity(1);
    });

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
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    congregationsLayer.eachLayer(marker => {
      marker.setOpacity(1);
    });
    return;
  }

  congregationsLayer.eachLayer(marker => {
    const latlng = marker.getLatLng();
    const feature = congregationsData.find(f => {
      const [lng, lat] = f.geometry.coordinates;
      return Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001;
    });

    if (feature && feature.properties.Name.toLowerCase().includes(query)) {
      marker.setOpacity(1);
    } else {
      marker.setOpacity(0.15);
    }
  });
}

function updateStats() {
  const statsValue = document.querySelector('.stats-value');
  if (statsValue) {
    statsValue.textContent = congregationsData.length;
  }
}

function setupControls() {
  const zoomFitBtn = document.getElementById('zoomFitBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');

  if (zoomFitBtn) {
    zoomFitBtn.addEventListener('click', zoomToFitAll);
  }

  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
    });
  }

  if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', () => {
      helpModal.classList.add('hidden');
    });
  }

  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.classList.add('hidden');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('searchInput').value = '';
      filterMarkers();
      helpModal.classList.add('hidden');
    }
    if (e.key === 'f' || e.key === 'F') {
      zoomToFitAll();
    }
  });
}

function zoomToFitAll() {
  if (congregationsLayer && congregationsLayer.getLayers().length > 0) {
    map.fitBounds(congregationsLayer.getBounds(), { padding: [50, 50] });
  }
}

document.addEventListener('DOMContentLoaded', initMap);
