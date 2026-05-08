# 🗺️ Mapa de Congregações - Campo Maguari

Aplicação web interativa para visualizar e explorar as congregações do Campo Maguari em Belém, PA. Construída com Leaflet.js, oferece uma experiência moderna e responsiva para navegação e busca de congregações.

**Link de Acesso:** https://gierrejunior.github.io/mapa_congregacoes_maguari/

## ✨ Recursos Principais

- 🗺️ **Mapa Interativo** com múltiplas camadas (OpenStreetMap, Satélite, Topográfico, Modo Escuro)
- 🔍 **Busca em Tempo Real** para filtrar congregações por nome
- 📍 **Integração GPS** com Waze e Google Maps
- 📋 **Copiar Coordenadas** com um clique
- 🎯 **Zoom Automático** para encaixar todos os marcadores
- ❓ **Help Modal** com instruções e atalhos de teclado
- 📱 **Design Totalmente Responsivo** para PC, tablet e celular
- 🎨 **Interface Moderna** com gradientes, animações e feedback visual
- 📦 **Carregamento Dinâmico** de dados em formato GeoJSON
- ⚡ **Sem Backend** - funciona 100% no cliente (Client-side only)

## 🏗️ Estrutura do Projeto

```
mapa-congregacoes/
├── index.html                      # Página principal
├── css/
│   └── style.css                   # Estilos responsivos (mobile-first)
├── js/
│   └── app.js                      # Lógica principal da aplicação
├── data/
│   ├── congregacoes.geojson        # 77 congregações (pontos)
│   └── limite_campo.geojson        # Limite do campo (polígono)
├── .github/
│   └── workflows/
│       └── deploy-pages.yml        # Automação GitHub Pages
├── .nojekyll                       # Desabilita Jekyll processing
└── README.md                       # Documentação
```

## 🚀 Como Usar

### Localmente com Servidor HTTP

```bash
cd mapa-congregacoes
python3 -m http.server 8000
# Abra: http://localhost:8000
```

### Navegadores Suportados

- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Todos os navegadores mobile modernos

## 📖 Guia de Uso

### 🔍 Buscar Congregação

1. Clique no campo de busca no topo do mapa
2. Digite o nome da congregação (a busca é em tempo real)
3. Os marcadores encontrados permanecerão opcos normais
4. Os não encontrados ficarão com opacidade baixa
5. Pressione **ESC** para limpar a busca

### 📍 Visualizar Detalhes

1. Clique em qualquer marcador (⛪) no mapa
2. Um popup aparecerá com:
   - Nome da congregação
   - Informações adicionais (se disponível)
   - Coordenadas GPS (latitude, longitude)
   - Três botões de ação:
     - **📍 Abrir no Waze** - Navegação GPS em tempo real
     - **🗺️ Google Maps** - Mapa com instruções de direção
     - **📋 Copiar Coordenadas** - Copia para clipboard

### 🗺️ Trocar Mapa Base

Use os botões no canto inferior direito:

- **🗺️ Mapa** - OpenStreetMap (padrão)
- **🛰️ Satélite** - Esri World Imagery
- **⛰️ Topo** - OpenTopoMap (com topografia)
- **🌙 Escuro** - CartoDB Dark

### 🎯 Zoom Automático

Clique no botão **🎯** (ou pressione **F**) para:
- Encaixar todos os marcadores no viewport
- Ajustar o zoom automaticamente para a melhor visualização

### ❓ Ajuda e Atalhos

Clique no botão **❓** para abrir um modal com:
- Instruções de uso
- Descrição de cada funcionalidade
- Atalhos de teclado disponíveis

### ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| **ESC** | Limpar busca / Fechar help modal |
| **F** | Zoom automático para encaixar todos os marcadores |

## 🗂️ Dados GeoJSON

### Formato da Congregação

```json
{
  "type": "Feature",
  "properties": {
    "Name": "Nome da Congregação",
    "PopupInfo": "Detalhes adicionais (opcional)"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-48.391406, -1.339972]
  }
}
```

### Limite do Campo

Um polígono que define o perímetro geográfico do Campo Maguari.

## 📝 Atualizando Dados

Para adicionar, remover ou editar congregações:

1. Edite `data/congregacoes.geojson` em um editor de texto
2. Mantenha o formato GeoJSON válido
3. Salve o arquivo
4. Recarregue a página no navegador

**Nenhuma alteração no código é necessária!** Os dados são carregados dinamicamente via Fetch API.

## 🎨 Design e Responsividade

### Breakpoints

- **Desktop** (> 768px): Layout otimizado com elementos posicionados nas laterais
- **Tablet** (768px - 480px): Layout adaptado com ajustes de espaçamento
- **Mobile** (< 480px): Otimizado para telas pequenas, botões maiores

### Paleta de Cores

- **Primária**: Teal `#16a085` - Accent color principal
- **Secundária**: Azul Escuro `#1e3a5f` - Header e destaque
- **Neutro**: Branco `#ffffff` e Cinza `#e0e0e0` - Cards e bordas

## 🔧 Tecnologias Utilizadas

- **Leaflet.js** 1.9.4 - Biblioteca de mapeamento open-source
- **OpenStreetMap** - Tile layer de mapas
- **Esri ArcGIS** - Camada de satélite
- **OpenTopoMap** - Camada topográfica
- **CartoDB** - Camada dark
- **Vanilla JavaScript** - Sem frameworks
- **CSS3** - Flexbox, Grid, Media Queries
- **Fetch API** - Carregamento de dados
- **GitHub Pages** - Hosting automático
- **GitHub Actions** - CI/CD deployment

## 📦 Dependências Externas

Todas as dependências são carregadas via CDN:

```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">

<!-- Leaflet JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
```

## 🚀 Deployment Automático

Este projeto usa GitHub Actions para deployment automático:

1. Qualquer push para `main` dispara o workflow
2. O site é automaticamente publicado em GitHub Pages
3. URL: `https://gierrejunior.github.io/mapa_congregacoes_maguari/`

## 📸 Screenshots

### Desktop
- Mapa com busca centralizada no topo
- Controles no canto inferior direito (zoom, help, basemap)
- Estatísticas no topo direito
- Legenda no canto inferior direito

### Mobile
- Busca logo abaixo do header
- Controles reposicionados para evitar overlapping
- Estatísticas no canto inferior esquerdo
- Layout otimizado para telas pequenas

## 🛠️ Melhorias Futuras

- [ ] Filtro por distância/raio
- [ ] Export de dados (CSV/GeoJSON)
- [ ] Clustering de marcadores para áreas densas
- [ ] Tema dark mode toggle
- [ ] Histórico de busca
- [ ] Compartilhamento de localização
- [ ] Modo offline com service workers
- [ ] Múltiplos idiomas (EN, ES)

## 🤝 Contribuições

Contribuições são bem-vindas! Para relatar problemas ou sugerir melhorias:

1. Abra uma issue no repositório
2. Descreva o problema ou sugestão
3. Forneça exemplos se possível

## 📄 Licença

Este projeto é fornecido gratuitamente para uso pessoal, educacional e comunitário.

## 👨‍💻 Desenvolvido por

Desenvolvido com ❤️ para o Campo Maguari, Belém - PA

**Repositório:** https://github.com/gierrejunior/mapa_congregacoes_maguari

---

**Última atualização:** Maio 2026
