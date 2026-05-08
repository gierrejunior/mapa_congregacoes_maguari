// ============================================
// ESTADO GLOBAL
// ============================================
let map;
let congregationsLayer;
let boundaryLayer;
let congregationsData = [];
let currentBasemap = 'osm';
let userLocationMarker = null;
let userLocationAccuracyCircle = null;

// Estado do filtro (global)
const filterState = {
  query: '',
  activeCount: 0,
  totalCount: 0
};

// ============================================
// BASEMAPS
// ============================================
const basemaps = {
  osm: {
    name: 'OpenStreetMap',
    tile: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    })
  },
  light: {
    name: 'CARTO Light',
    tile: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO',
      maxZoom: 20
    })
  },
  satellite: {
    name: 'Satélite (Esri)',
    tile: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    })
  },
  topo: {
    name: 'Topográfico',
    tile: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
      maxZoom: 17
    })
  },
  dark: {
    name: 'CARTO Dark',
    tile: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO',
      maxZoom: 20
    })
  }
};

// ============================================
// CARREGAR DADOS
// ============================================
async function loadGeoJSON(filePath) {
  console.log(`Carregando ${filePath}...`);
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`✓ ${filePath} carregado com sucesso`);
    return data;
  } catch (error) {
    console.error(`✗ Erro ao carregar ${filePath}:`, error);
    throw error;
  }
}

// ============================================
// INICIALIZAR MAPA
// ============================================
function initMap() {
  console.log('Inicializando mapa...');
  
  // Verificar se Leaflet está disponível
  if (typeof L === 'undefined') {
    alert('Erro: Leaflet.js não carregou. Verifique a conexão com a internet.');
    return;
  }

  // Verificar se o container existe
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    alert('Erro: Elemento #map não encontrado no HTML.');
    return;
  }

  map = L.map('map').setView([-1.345, -48.380], 14);
  
  // Carregar basemap do localStorage ou usar padrão
  const savedBasemap = localStorage.getItem('selectedBasemap') || 'osm';
  currentBasemap = savedBasemap;
  basemaps[currentBasemap].tile.addTo(map);
  
  console.log('Mapa criado. Carregando dados...');
  
  // Carregar dados
  loadData();
  
  // Inicializar UI
  setupSearch();
  setupPanels();
  setupControls();
  setupBasemapPanel();
  setupLocation();
  
  console.log('Inicialização completa!');
}

// ============================================
// CARREGAR DADOS
// ============================================
async function loadData() {
  try {
    console.log('Iniciando carregamento de dados GeoJSON...');
    
    const [congregacoes, limiteData] = await Promise.all([
      loadGeoJSON('data/congregacoes.geojson'),
      loadGeoJSON('data/limite_campo.geojson')
    ]);

    congregationsData = congregacoes.features;
    filterState.totalCount = congregationsData.length;
    filterState.activeCount = congregationsData.length;
    
    console.log(`Dados carregados: ${congregationsData.length} congregações`);
    
    renderBoundary(limiteData);
    renderMarkers();
    updateStats();
    
    console.log('Dados renderizados com sucesso!');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert(`Erro ao carregar dados:\n\n${error.message}\n\nVerifique:\n1. Se está usando um servidor HTTP (não abra o arquivo diretamente)\n2. Se os arquivos estão em: data/congregacoes.geojson e data/limite_campo.geojson\n3. Se o servidor está rodando na porta 8000`);
  }
}

// ============================================
// RENDERIZAR LIMITE DO CAMPO
// ============================================
function renderBoundary(data) {
  if (boundaryLayer) map.removeLayer(boundaryLayer);

  boundaryLayer = L.geoJSON(data, {
    style: {
      color: '#16a085',
      weight: 2,
      opacity: 0.5,
      dashArray: '5, 5',
      fillOpacity: 0.05,
    }
  }).addTo(map);
}

// ============================================
// RENDERIZAR MARCADORES
// ============================================
function renderMarkers() {
  if (congregationsLayer) map.removeLayer(congregationsLayer);

  congregationsLayer = L.featureGroup();

  congregationsData.forEach(feature => {
    const { geometry, properties } = feature;
    const [lng, lat] = geometry.coordinates;

    const icon = L.divIcon({
      html: `<div class="church-marker">⛪</div>`,
      className: 'church-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });

    const marker = L.marker([lat, lng], { icon });
    marker.bindPopup(createPopup(properties, lat, lng));
    
    // Verificar se o marcador deve ser visível conforme o filtro
    const isVisible = filterState.query === '' || 
                     properties.Name.toLowerCase().includes(filterState.query.toLowerCase());
    
    marker.setOpacity(isVisible ? 1 : 0.15);
    congregationsLayer.addLayer(marker);
  });

  congregationsLayer.addTo(map);
}

// ============================================
// CRIAR POPUP
// ============================================
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
        📍 Waze
      </a>
      <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="action-btn btn-gmaps">
        🗺️ Google Maps
      </a>
      <button class="action-btn btn-copy" onclick="copyCoordinates('${lat}', '${lng}')">
        📋 Copiar
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

// ============================================
// FILTRO E BUSCA
// ============================================
function setupSearch() {
  const searchSidebarBtn = document.getElementById('searchSidebarBtn');
  const searchInput = document.getElementById('searchInput');
  const searchPanel = document.getElementById('searchPanel');
  const searchPanelClose = document.getElementById('searchPanelClose');
  
  // Abrir painel de busca ao clicar no botão
  if (searchSidebarBtn) {
    searchSidebarBtn.addEventListener('click', () => {
      searchPanel.classList.remove('hidden');
      document.getElementById('locationPanel').classList.add('hidden');
      if (searchInput) {
        searchInput.focus();
      }
    });
  }
  
  // Fechar painel de busca
  if (searchPanelClose) {
    searchPanelClose.addEventListener('click', () => {
      searchPanel.classList.add('hidden');
      clearFilter();
    });
  }
  
  // Filtrar ao digitar
  if (searchInput) {
    searchInput.addEventListener('input', filterMarkers);
  }

  // Limpar filtro ao pressionar ESC e fechar painel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearFilter();
      searchPanel.classList.add('hidden');
    }
  });
}

function filterMarkers() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.toLowerCase().trim();

  filterState.query = query;

  // Atualizar visibilidade dos marcadores
  let visibleCount = 0;
  const visibleFeatures = [];

  congregationsLayer.eachLayer(marker => {
    const latlng = marker.getLatLng();
    const feature = congregationsData.find(f => {
      const [lng, lat] = f.geometry.coordinates;
      return Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001;
    });

    if (feature && feature.properties.Name.toLowerCase().includes(query)) {
      marker.setOpacity(1);
      visibleCount++;
      visibleFeatures.push(feature);
    } else {
      marker.setOpacity(0.15);
    }
  });

  filterState.activeCount = visibleCount;
  updateStats();
  populateSearchResults(visibleFeatures);
  autoZoomResults(visibleFeatures);
}

function clearFilter() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  filterState.query = '';
  filterState.activeCount = congregationsData.length;

  congregationsLayer.eachLayer(marker => {
    marker.setOpacity(1);
  });

  updateStats();
  populateSearchResults([]);
}

// ============================================
// POPULAR LISTA DE RESULTADOS DE BUSCA
// ============================================
function populateSearchResults(features) {
  const resultsList = document.getElementById('searchResultsList');
  resultsList.innerHTML = '';

  if (features.length === 0) {
    return;
  }

  features.forEach((feature, index) => {
    const item = document.createElement('div');
    item.className = 'congregation-result-item';
    item.textContent = feature.properties.Name;
    item.dataset.index = index;
    item.dataset.lat = feature.geometry.coordinates[1];
    item.dataset.lng = feature.geometry.coordinates[0];

    item.addEventListener('click', () => {
      // Encontrar o marcador correspondente
      const marker = congregationsLayer.getLayers().find(m => {
        const latlng = m.getLatLng();
        const [lng, lat] = feature.geometry.coordinates;
        return Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001;
      });

      if (marker) {
        // Zoom no marcador
        map.setView(marker.getLatLng(), 16);
        // Abrir popup
        marker.openPopup();
        // Limpar filtro automaticamente (fecha painel e restaura todos os marcadores)
        clearFilter();
      }
    });

    resultsList.appendChild(item);
  });
}

// ============================================
// AUTO-ZOOM BASEADO NOS RESULTADOS
// ============================================
function autoZoomResults(features) {
  if (features.length === 0) {
    return;
  }

  if (features.length === 1) {
    // 1 resultado: zoom no marcador
    const [lng, lat] = features[0].geometry.coordinates;
    map.setView([lat, lng], 16);
  } else if (features.length > 1) {
    // Múltiplos resultados: ajustar bounds para mostrar todos
    const bounds = L.latLngBounds(
      features.map(f => {
        const [lng, lat] = f.geometry.coordinates;
        return [lat, lng];
      })
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

// ============================================
// FORMATAR TEXTO DE ESTATÍSTICAS
// ============================================
function formatStatsText(activeCount, totalCount, query) {
  if (query === '') {
    return `${totalCount} congregações`;
  } else {
    return `${activeCount} de ${totalCount} congregações`;
  }
}

// ============================================
// ATUALIZAR STATS
// ============================================
function updateStats() {
  const statsText = document.querySelector('.mini-stats .stats-text');
  const searchResultsCount = document.getElementById('searchResultsCount');

  const formattedText = formatStatsText(filterState.activeCount, filterState.totalCount, filterState.query);

  if (statsText) {
    statsText.textContent = formattedText;
  }

  if (searchResultsCount) {
    searchResultsCount.textContent = formattedText;
  }
}

// ============================================
// PAINÉIS (Basemap)
// ============================================
function setupPanels() {
  // Painel de basemap
  const basemapSidebarBtn = document.getElementById('basemapSidebarBtn');
  const basemapPanel = document.getElementById('basemapPanel');
  const basemapPanelClose = document.getElementById('basemapPanelClose');
  const searchPanel = document.getElementById('searchPanel');
  const helpModal = document.getElementById('helpModal');
  
  if (basemapSidebarBtn) {
    basemapSidebarBtn.addEventListener('click', () => {
      basemapPanel.classList.toggle('hidden');
      searchPanel.classList.add('hidden');
      helpModal.classList.add('hidden');
      document.getElementById('locationPanel').classList.add('hidden');
    });
  }
  
  if (basemapPanelClose) {
    basemapPanelClose.addEventListener('click', () => {
      basemapPanel.classList.add('hidden');
    });
  }
  
  basemapPanel.addEventListener('click', (e) => {
    if (e.target === basemapPanel) {
      basemapPanel.classList.add('hidden');
    }
  });
}

// ============================================
// PAINEL DE BASEMAP
// ============================================
function setupBasemapPanel() {
  const basemapPanelContent = document.getElementById('basemapPanelContent');
  
  // Criar cards de basemap
  Object.entries(basemaps).forEach(([key, basemap]) => {
    const card = document.createElement('div');
    card.className = `basemap-card ${key === currentBasemap ? 'active' : ''}`;
    card.textContent = basemap.name;
    card.dataset.basemap = key;
    
    card.addEventListener('click', () => {
      switchBasemap(key);
      // Atualizar UI
      document.querySelectorAll('.basemap-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      // Fechar painel no mobile
      if (window.innerWidth <= 768) {
        document.getElementById('basemapPanel').classList.add('hidden');
      }
    });
    
    basemapPanelContent.appendChild(card);
  });
}

function switchBasemap(basemapName) {
  if (currentBasemap && basemaps[currentBasemap]) {
    map.removeLayer(basemaps[currentBasemap].tile);
  }
  if (basemaps[basemapName]) {
    basemaps[basemapName].tile.addTo(map);
    currentBasemap = basemapName;
    // Salvar no localStorage
    localStorage.setItem('selectedBasemap', basemapName);
  }
}

// ============================================
// CONTROLES
// ============================================
function setupControls() {
  const zoomFitSidebarBtn = document.getElementById('zoomFitSidebarBtn');
  const helpSidebarBtn = document.getElementById('helpSidebarBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const basemapPanel = document.getElementById('basemapPanel');
  const searchPanel = document.getElementById('searchPanel');

  if (zoomFitSidebarBtn) {
    zoomFitSidebarBtn.addEventListener('click', zoomToFitAll);
  }

  if (helpSidebarBtn) {
    helpSidebarBtn.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
      basemapPanel.classList.add('hidden');
      searchPanel.classList.add('hidden');
      document.getElementById('locationPanel').classList.add('hidden');
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

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      helpModal.classList.add('hidden');
      basemapPanel.classList.add('hidden');
      searchPanel.classList.add('hidden');
      document.getElementById('locationPanel').classList.add('hidden');
    }
    if (e.key === 'f' || e.key === 'F') {
      zoomToFitAll();
    }
  });
}

function zoomToFitAll() {
  // Limpar qualquer filtro ativo
  clearFilter();

  if (congregationsLayer && congregationsLayer.getLayers().length > 0) {
    // Usar todos os marcadores (sem filtro)
    const allLayers = congregationsLayer.getLayers();
    if (allLayers.length > 0) {
      if (allLayers.length === 1) {
        // 1 marcador: zoom nele
        map.setView(allLayers[0].getLatLng(), 16);
      } else {
        // Múltiplos: fit bounds de todos os marcadores + limite do campo
        const bounds = L.featureGroup(allLayers).getBounds();

        // Incluir limite do campo nos bounds se existir
        if (fieldBoundaryLayer) {
          const boundaryBounds = fieldBoundaryLayer.getBounds();
          if (boundaryBounds.isValid()) {
            bounds.extend(boundaryBounds);
          }
        }

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }
}

// ============================================
// LOCALIZAÇÃO DO USUÁRIO
// ============================================
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlambda = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function showUserOnMap(lat, lng, accuracy) {
  if (userLocationMarker) map.removeLayer(userLocationMarker);
  if (userLocationAccuracyCircle) map.removeLayer(userLocationAccuracyCircle);

  const icon = L.divIcon({
    html: `<div class="user-location-icon"><div class="user-location-pulse"></div><div class="user-location-dot"></div></div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  userLocationMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 });
  userLocationMarker.bindPopup(`
    <div class="popup-title">Minha Localização</div>
    <div class="popup-coordinates">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
  `);
  userLocationMarker.addTo(map);

  if (accuracy && accuracy < 500) {
    userLocationAccuracyCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#2980b9',
      fillColor: '#2980b9',
      fillOpacity: 0.08,
      weight: 1,
      opacity: 0.4
    }).addTo(map);
  }

  document.getElementById('userLocationLegend').classList.remove('hidden');
}

function clearUserLocation() {
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
    userLocationMarker = null;
  }
  if (userLocationAccuracyCircle) {
    map.removeLayer(userLocationAccuracyCircle);
    userLocationAccuracyCircle = null;
  }
  document.getElementById('userLocationLegend').classList.add('hidden');
  document.getElementById('locationPanel').classList.add('hidden');
}

function showNearbyPanel(userLat, userLng) {
  document.getElementById('searchPanel').classList.add('hidden');
  document.getElementById('basemapPanel').classList.add('hidden');
  document.getElementById('helpModal').classList.add('hidden');
  document.getElementById('locationPanel').classList.remove('hidden');

  const sorted = congregationsData
    .map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return { feature, distance: haversineDistance(userLat, userLng, lat, lng) };
    })
    .sort((a, b) => a.distance - b.distance);

  const list = document.getElementById('nearbyResultsList');
  list.innerHTML = '';

  sorted.forEach(({ feature, distance }) => {
    const item = document.createElement('div');
    item.className = 'congregation-result-item nearby-result-item';
    item.innerHTML = `
      <span class="nearby-name">${feature.properties.Name}</span>
      <span class="nearby-distance">${formatDistance(distance)}</span>
    `;

    item.addEventListener('click', () => {
      const [lng, lat] = feature.geometry.coordinates;
      const marker = congregationsLayer.getLayers().find(m => {
        const latlng = m.getLatLng();
        return Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001;
      });
      if (marker) {
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
        document.getElementById('locationPanel').classList.add('hidden');
      }
    });

    list.appendChild(item);
  });
}

function setupLocation() {
  const locationBtn = document.getElementById('locationSidebarBtn');
  const locationPanelClose = document.getElementById('locationPanelClose');
  const clearLocationBtn = document.getElementById('clearLocationBtn');

  if (locationBtn) {
    locationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocalização não é suportada neste navegador.');
        return;
      }

      // Se já tem localização, apenas recentra e abre o painel
      if (userLocationMarker) {
        const latlng = userLocationMarker.getLatLng();
        map.setView(latlng, 15);
        showNearbyPanel(latlng.lat, latlng.lng);
        return;
      }

      locationBtn.textContent = '⏳';
      locationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          locationBtn.textContent = '📍';
          locationBtn.disabled = false;

          showUserOnMap(latitude, longitude, accuracy);
          map.setView([latitude, longitude], 15);
          showNearbyPanel(latitude, longitude);
        },
        (err) => {
          locationBtn.textContent = '📍';
          locationBtn.disabled = false;

          const messages = {
            1: 'Permissão de localização negada. Verifique as configurações do navegador.',
            2: 'Localização não disponível no momento.',
            3: 'Tempo esgotado ao obter a localização.'
          };
          alert(messages[err.code] || 'Erro ao obter localização.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  if (locationPanelClose) {
    locationPanelClose.addEventListener('click', () => {
      document.getElementById('locationPanel').classList.add('hidden');
    });
  }

  if (clearLocationBtn) {
    clearLocationBtn.addEventListener('click', clearUserLocation);
  }
}

// ============================================
// INICIAR
// ============================================
console.log('App.js carregado. Aguardando DOMContentLoaded...');
document.addEventListener('DOMContentLoaded', initMap);
