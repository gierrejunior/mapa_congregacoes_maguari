// ============================================
// ESTADO GLOBAL
// ============================================
let map;
let congregationsLayer;
let boundaryLayer;
let congregationsData = [];
let currentBasemap = 'osm';

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
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Failed to load ${filePath}`);
  return response.json();
}

// ============================================
// INICIALIZAR MAPA
// ============================================
function initMap() {
  map = L.map('map').setView([-1.345, -48.380], 14);
  
  // Carregar basemap do localStorage ou usar padrão
  const savedBasemap = localStorage.getItem('selectedBasemap') || 'osm';
  currentBasemap = savedBasemap;
  basemaps[currentBasemap].tile.addTo(map);
  
  // Carregar dados
  loadData();
  
  // Inicializar UI
  setupSearch();
  setupPanels();
  setupControls();
  setupBasemapPanel();
}

// ============================================
// CARREGAR DADOS
// ============================================
async function loadData() {
  try {
    const [congregacoes, limiteData] = await Promise.all([
      loadGeoJSON('data/congregacoes.geojson'),
      loadGeoJSON('data/limite_campo.geojson')
    ]);

    congregationsData = congregacoes.features;
    filterState.totalCount = congregationsData.length;
    filterState.activeCount = congregationsData.length;
    
    renderBoundary(limiteData);
    renderMarkers();
    updateStats();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Erro ao carregar dados. Verifique se os arquivos GeoJSON estão corretos.');
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
  const searchInput = document.getElementById('searchInput');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterMarkers);
  }

  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      // Abrir painel de busca no mobile (poderia ser expandir o campo)
      // Por enquanto, apenas dar foco no input
      if (searchInput) {
        searchInput.focus();
        // Em uma implementação mais robusta, seria um campo flutuante separado
      }
    });
  }

  // Limpar filtro ao pressionar ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearFilter();
    }
  });
}

function filterMarkers() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.toLowerCase().trim();
  
  filterState.query = query;
  
  // Atualizar visibilidade dos marcadores
  let visibleCount = 0;
  congregationsLayer.eachLayer(marker => {
    const latlng = marker.getLatLng();
    const feature = congregationsData.find(f => {
      const [lng, lat] = f.geometry.coordinates;
      return Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001;
    });

    if (feature && feature.properties.Name.toLowerCase().includes(query)) {
      marker.setOpacity(1);
      visibleCount++;
    } else {
      marker.setOpacity(0.15);
    }
  });

  filterState.activeCount = visibleCount;
  updateStats();
  updateFilterChip();
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
  updateFilterChip();
}

// ============================================
// ATUALIZAR STATS
// ============================================
function updateStats() {
  const statsValues = document.querySelectorAll('.stats-value');
  statsValues.forEach(el => {
    if (filterState.query === '') {
      el.textContent = filterState.totalCount;
    } else {
      el.textContent = `${filterState.activeCount} de ${filterState.totalCount}`;
    }
  });
}

// ============================================
// CHIP DE FILTRO ATIVO
// ============================================
function updateFilterChip() {
  const filterChip = document.getElementById('filterChip');
  const filterChipText = document.getElementById('filterChipText');
  const filterChipClose = document.getElementById('filterChipClose');
  
  if (filterState.query === '') {
    filterChip.classList.add('hidden');
  } else {
    filterChip.classList.remove('hidden');
    filterChipText.textContent = filterState.query;
  }
  
  if (filterChipClose) {
    filterChipClose.addEventListener('click', (e) => {
      e.stopPropagation();
      clearFilter();
    });
  }
}

// ============================================
// PAINÉIS (Basemap e Funções)
// ============================================
function setupPanels() {
  // Painel de basemap
  const basemapToggleBtn = document.getElementById('basemapToggleBtn');
  const basemapPanel = document.getElementById('basemapPanel');
  const basemapPanelClose = document.getElementById('basemapPanelClose');
  
  if (basemapToggleBtn) {
    basemapToggleBtn.addEventListener('click', () => {
      basemapPanel.classList.toggle('hidden');
      document.getElementById('functionsPanel').classList.add('hidden');
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
  
  // Painel de funções
  const functionsToggleBtn = document.getElementById('functionsToggleBtn');
  const functionsPanel = document.getElementById('functionsPanel');
  const functionsPanelClose = document.getElementById('functionsPanelClose');
  
  if (functionsToggleBtn) {
    functionsToggleBtn.addEventListener('click', () => {
      functionsPanel.classList.toggle('hidden');
      basemapPanel.classList.add('hidden');
    });
  }
  
  if (functionsPanelClose) {
    functionsPanelClose.addEventListener('click', () => {
      functionsPanel.classList.add('hidden');
    });
  }
  
  functionsPanel.addEventListener('click', (e) => {
    if (e.target === functionsPanel) {
      functionsPanel.classList.add('hidden');
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
      document.getElementById('functionsPanel').classList.add('hidden');
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
      document.getElementById('basemapPanel').classList.add('hidden');
      document.getElementById('functionsPanel').classList.add('hidden');
    }
    if (e.key === 'f' || e.key === 'F') {
      zoomToFitAll();
    }
  });
}

function zoomToFitAll() {
  if (congregationsLayer && congregationsLayer.getLayers().length > 0) {
    // Contar apenas marcadores visíveis
    const visibleLayers = congregationsLayer.getLayers().filter(m => m.getOpacity() > 0.5);
    if (visibleLayers.length > 0) {
      const bounds = L.featureGroup(visibleLayers).getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}

// ============================================
// INICIAR
// ============================================
document.addEventListener('DOMContentLoaded', initMap);
