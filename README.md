# Mapa de Congregações - Campo Maguari

Aplicação interativa para visualizar as 81 congregações do Campo Maguari em Belém, PA.

## Recursos

✨ **Mapa Interativo** com Leaflet.js e OpenStreetMap
🔍 **Busca e Filtro** de congregações em tempo real
📍 **Integração com Navegação GPS** via Waze e Google Maps
📋 **Copiar Coordenadas** com um clique
📱 **Design Responsivo** para PC, tablet e celular
🎨 **Interface Moderna** com gradientes e animações
📦 **Carregamento Dinâmico** de dados GeoJSON

## Estrutura do Projeto

```
mapa-congregacoes/
├── index.html           # Página principal com Leaflet.js
├── css/
│   └── style.css        # Estilos responsivos
├── js/
│   └── app.js           # Lógica da aplicação
├── data/
│   ├── congregacoes.geojson    # 81 congregações (pontos)
│   └── limite_campo.geojson    # Limite do campo (polígono)
└── README.md            # Documentação
```

## Como Usar

### Localmente

1. Baixe ou clone todos os arquivos
2. Abra `index.html` em um navegador (a maioria dos navegadores modernos funciona)
3. Ou execute um servidor HTTP local:

```bash
cd /home/gr-dev/mudanca_uso_solo_markov/mapa-congregacoes/
python3 -m http.server 8000
# Acesse: http://localhost:8000
```

### GitHub Pages

1. Coloque a pasta `mapa-congregacoes` no repositório
2. Ative GitHub Pages nas configurações do repositório
3. A aplicação estará acessível em: `https://seu-usuario.github.io/seu-repositorio/mapa-congregacoes/`

## Funcionalidades

### Busca
Digite o nome de uma congregação na caixa de busca para filtrar os marcadores. Os resultados são mostrados em tempo real com opacidade ajustada.

### Pop-up Interativo
Clique em qualquer congregação para ver:
- Nome da congregação
- Informações adicionais
- Coordenadas GPS (latitude, longitude)
- Botões de ação:
  - **📍 Waze**: Abre a localização no Waze para navegação
  - **🗺️ Google Maps**: Abre no Google Maps
  - **📋 Copiar**: Copia as coordenadas para a área de transferência

### Estatísticas
Mostra o total de congregações (81) no topo direito do mapa.

### Legenda
- Círculos azuis: Congregações
- Linha tracejada: Limite do campo Maguari

## Dados

Os dados estão em formato GeoJSON:

### congregacoes.geojson
```json
{
  "type": "Feature",
  "properties": {
    "Name": "Nome da Congregação",
    "PopupInfo": "Informação adicional"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-48.391406, -1.339972]
  }
}
```

### limite_campo.geojson
Polígono definindo o limite geográfico do campo.

## Atualizando Dados

Para atualizar as congregações ou o limite do campo:

1. Modifique `data/congregacoes.geojson` ou `data/limite_campo.geojson`
2. Mantenha o formato GeoJSON válido
3. Salve os arquivos
4. Recarregue a página no navegador

**Nenhuma alteração no código é necessária!** Os dados são carregados dinamicamente via Fetch API.

## Compatibilidade

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile (iOS Safari, Chrome Android)

## Dependências

- **Leaflet.js** 1.9.4 - Biblioteca de mapeamento
- **OpenStreetMap** - Mapa base
- Sem dependências de servidor - funciona totalmente no cliente

## Licença

Gratuito para uso pessoal e comunitário.

## Suporte

Para reportar problemas ou sugerir melhorias, entre em contato.
