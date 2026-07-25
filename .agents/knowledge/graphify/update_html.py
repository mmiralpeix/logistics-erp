import json
import os

html_path = r"c:\Users\manum\.gemini\antigravity-ide\scratch\logistics-erp\.agents\knowledge\graphify\GRAPH_TREE.html"

# Read existing initialJsonData from current HTML
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "const initialJsonData = "
start_idx = content.find(start_marker)
if start_idx != -1:
    json_start = start_idx + len(start_marker)
    json_end = content.find(";\n", json_start)
    if json_end == -1:
        json_end = content.find("\n", json_start)
    json_str = content[json_start:json_end].strip()
else:
    json_str = '{"name":"/","total_count":728,"children":[]}'

graph_json_path = r"c:\Users\manum\.gemini\antigravity-ide\scratch\logistics-erp\.agents\knowledge\graphify\graph.json"
if os.path.exists(graph_json_path):
    with open(graph_json_path, "r", encoding="utf-8") as f:
        graph_rel_str = f.read()
else:
    graph_rel_str = '{"nodes":[],"edges":[]}'

enhanced_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graphify — Architecture & Knowledge Navigator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    :root {{
      --bg-dark: #090d16;
      --bg-card: rgba(15, 23, 42, 0.85);
      --bg-glass: rgba(30, 41, 59, 0.6);
      --border-glass: rgba(255, 255, 255, 0.12);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --cyan-accent: #38bdf8;
      --purple-accent: #c084fc;
      --emerald-accent: #34d399;
      --amber-accent: #fbbf24;
      --rose-accent: #f43f5e;
      --indigo-accent: #818cf8;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Inter', sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      overflow: hidden;
      height: 100vh;
      width: 100vw;
    }}

    /* Background Ambient Grid */
    .bg-grid {{
      position: fixed;
      inset: 0;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(192, 132, 252, 0.1) 0%, transparent 40%),
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
      pointer-events: none;
      z-index: 0;
    }}

    /* App Container */
    #app-layout {{
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }}

    /* Glass Header */
    header {{
      height: 64px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-glass);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .brand-icon {{
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
    }}

    .brand-title {{
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}

    .stats-badge {{
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(56, 189, 248, 0.12);
      color: var(--cyan-accent);
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-weight: 600;
    }}

    /* Navigation Tabs */
    .view-tabs {{
      display: flex;
      background: rgba(15, 23, 42, 0.6);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border-glass);
      gap: 4px;
    }}

    .tab-btn {{
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }}

    .tab-btn:hover {{
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }}

    .tab-btn.active {{
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.25));
      color: #fff;
      border: 1px solid rgba(56, 189, 248, 0.4);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }}

    /* Header Actions */
    .header-actions {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .search-box {{
      position: relative;
      display: flex;
      align-items: center;
    }}

    .search-box input {{
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border-glass);
      border-radius: 10px;
      padding: 8px 14px 8px 36px;
      color: #fff;
      font-size: 0.85rem;
      width: 220px;
      outline: none;
      transition: all 0.25s ease;
    }}

    .search-box input:focus {{
      width: 280px;
      border-color: var(--cyan-accent);
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.3);
    }}

    .search-icon {{
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      font-size: 14px;
      pointer-events: none;
    }}

    .action-btn {{
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-glass);
      background: rgba(30, 41, 59, 0.5);
      color: var(--text-main);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .action-btn:hover {{
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.25);
    }}

    /* Sub-bar / Legend */
    .sub-bar {{
      padding: 8px 24px;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }}

    .legend-container {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .legend-item {{
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
    }}

    .legend-dot {{
      width: 10px;
      height: 10px;
      border-radius: 50%;
      box-shadow: 0 0 6px currentColor;
    }}

    /* Main Content Workspace */
    #workspace {{
      position: relative;
      flex: 1;
      overflow: hidden;
    }}

    .view-panel {{
      position: absolute;
      inset: 0;
      display: none;
    }}

    .view-panel.active {{
      display: block;
    }}

    /* Vis Network Canvas */
    #network-container {{
      width: 100%;
      height: 100%;
    }}

    /* D3 Tree View Canvas */
    #tree-view-container {{
      width: 100%;
      height: 100%;
      overflow: auto;
    }}

    svg.d3-chart {{
      width: 100%;
      height: 100%;
      min-width: 3000px;
      min-height: 2500px;
    }}

    .node circle {{
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .node text {{
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      fill: #e2e8f0;
      paint-order: stroke fill;
      stroke: #090d16;
      stroke-width: 3px;
      stroke-linejoin: round;
    }}

    .link {{
      fill: none;
      stroke: rgba(148, 163, 184, 0.25);
      stroke-width: 1.5px;
    }}

    /* Floating Detail Drawer */
    .drawer {{
      position: absolute;
      top: 16px;
      right: 16px;
      bottom: 16px;
      width: 360px;
      background: var(--bg-card);
      backdrop-filter: blur(24px);
      border: 1px solid var(--border-glass);
      border-radius: 16px;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
      padding: 24px;
      z-index: 10;
      transform: translateX(400px);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }}

    .drawer.open {{
      transform: translateX(0);
    }}

    .drawer-header {{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-glass);
      padding-bottom: 16px;
    }}

    .drawer-title {{
      font-family: 'Outfit', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      word-break: break-all;
    }}

    .close-btn {{
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s ease;
    }}

    .close-btn:hover {{
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }}

    .meta-group {{
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .meta-label {{
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }}

    .meta-value {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: var(--cyan-accent);
      background: rgba(15, 23, 42, 0.9);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      word-break: break-all;
    }}

    .children-list {{
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .child-item {{
      padding: 8px 12px;
      background: rgba(30, 41, 59, 0.4);
      border-radius: 8px;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }}

    .child-item:hover {{
      background: rgba(56, 189, 248, 0.1);
      border-color: rgba(56, 189, 248, 0.3);
      color: #fff;
    }}
  </style>
</head>
<body>
  <div class="bg-grid"></div>

  <div id="app-layout">
    <!-- Header -->
    <header>
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <div>
          <div class="brand-title">Graphify Navigator</div>
          <span class="stats-badge" id="stats-counter">728 Nodos • LogisticsPro ERP</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="view-tabs">
        <button class="tab-btn active" onclick="switchView('network', event)">
          <span>🌌</span> Red Interactiva
        </button>
        <button class="tab-btn" onclick="switchView('radial', event)">
          <span>🎯</span> Radial
        </button>
        <button class="tab-btn" onclick="switchView('tree', event)">
          <span>🌳</span> Jerárquico
        </button>
        <button class="tab-btn" onclick="switchView('arch', event)">
          <span>🔗</span> Arquitectura
        </button>
      </div>

      <!-- Actions -->
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" placeholder="Buscar módulos, archivos, símbolos..." oninput="handleSearch(this.value)">
        </div>

        <button class="action-btn" onclick="resetZoom()" title="Restablecer Vista">
          🎯 Centrar
        </button>
        <button class="action-btn" onclick="togglePhysics()" id="physics-btn" title="Activar/Desactivar Física">
          ⚡ Física: ON
        </button>
      </div>
    </header>

    <!-- Sub-bar with Categories -->
    <div class="sub-bar">
      <div class="legend-container">
        <div class="legend-item">
          <span class="legend-dot" style="background:#38bdf8; color:#38bdf8;"></span> Backend
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#34d399; color:#34d399;"></span> Frontend
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#c084fc; color:#c084fc;"></span> Controllers
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#818cf8; color:#818cf8;"></span> Services
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#fbbf24; color:#fbbf24;"></span> Modelos (Prisma)
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#f43f5e; color:#f43f5e;"></span> DTOs
        </div>
      </div>

      <div style="color: var(--text-muted);">
        Haz clic en cualquier nodo para inspeccionar sus detalles
      </div>
    </div>

    <!-- Workspace -->
    <div id="workspace">
      <!-- 1. Vis Network View -->
      <div id="view-network" class="view-panel active">
        <div id="network-container"></div>
      </div>

      <!-- 2. D3 Radial View -->
      <div id="view-radial" class="view-panel">
        <div id="radial-container" style="width:100%; height:100%;"></div>
      </div>

      <!-- 3. D3 Collapsible Tree View -->
      <div id="view-tree" class="view-panel">
        <div id="tree-view-container">
          <svg id="tree-svg" class="d3-chart"></svg>
        </div>
      </div>

      <!-- 4. Architecture Relationship Map -->
      <div id="view-arch" class="view-panel">
        <div id="arch-container" style="width:100%; height:100%;"></div>
      </div>

      <!-- Drawer -->
      <div class="drawer" id="node-drawer">
        <div class="drawer-header">
          <div>
            <span id="drawer-type" class="stats-badge" style="margin-bottom:6px; display:inline-block;">Módulo</span>
            <div class="drawer-title" id="drawer-title">Nombre del Nodo</div>
          </div>
          <button class="close-btn" onclick="closeDrawer()">×</button>
        </div>

        <div class="meta-group">
          <span class="meta-label">Ruta de Componente</span>
          <div class="meta-value" id="drawer-path">/src/modules/trips</div>
        </div>

        <div class="meta-group">
          <span class="meta-label">Métricas</span>
          <div style="display:flex; gap:12px;">
            <div class="meta-value" style="flex:1;">Sub-elementos: <b id="drawer-count">0</b></div>
          </div>
        </div>

        <div class="meta-group" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <span class="meta-label">Elementos Contenidos</span>
          <div class="children-list" id="drawer-children"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const initialJsonData = {json_str};
    const graphRelationsData = {graph_rel_str};

    let network = null;
    let visNodes = [];
    let visEdges = [];
    let isPhysicsOn = true;

    function getColorForName(name, parentName = '') {{
      const n = name.toLowerCase();
      const p = parentName.toLowerCase();

      if (n.includes('controller')) return {{ background: '#c084fc', border: '#a855f7', highlight: {{ background: '#e9d5ff', border: '#c084fc' }} }};
      if (n.includes('service')) return {{ background: '#818cf8', border: '#6366f1', highlight: {{ background: '#c7d2fe', border: '#818cf8' }} }};
      if (n.includes('dto')) return {{ background: '#f43f5e', border: '#e11d48', highlight: {{ background: '#fecdd3', border: '#f43f5e' }} }};
      if (n.includes('prisma') || n.includes('schema') || n.includes('seed')) return {{ background: '#fbbf24', border: '#d97706', highlight: {{ background: '#fef3c7', border: '#fbbf24' }} }};
      if (p.includes('backend') || n.includes('backend') || n.includes('nest')) return {{ background: '#38bdf8', border: '#0284c7', highlight: {{ background: '#bae6fd', border: '#38bdf8' }} }};
      if (p.includes('frontend') || n.includes('frontend') || n.includes('page') || n.includes('component')) return {{ background: '#34d399', border: '#059669', highlight: {{ background: '#a7f3d0', border: '#34d399' }} }};
      return {{ background: '#64748b', border: '#475569', highlight: {{ background: '#cbd5e1', border: '#64748b' }} }};
    }}

    function processTreeData(root) {{
      const nodesMap = new Map();
      const edgesArr = [];
      let idCounter = 1;

      function traverse(curr, parentId = null, path = '') {{
        const myId = idCounter++;
        const currentPath = path ? `${{path}}/${{curr.name}}` : curr.name;
        const color = getColorForName(curr.name, path);
        const count = curr.total_count || 1;
        const size = Math.min(45, Math.max(12, Math.log2(count + 1) * 8));

        nodesMap.set(myId, {{
          id: myId,
          label: curr.name,
          title: `${{curr.name}} (${{count}} elementos)`,
          value: count,
          size: size,
          color: color,
          font: {{ color: '#f8fafc', face: 'Inter', size: 12, strokeWidth: 3, strokeColor: '#090d16' }},
          borderWidth: 2,
          shadow: {{ enabled: true, color: color.background, size: 8, x: 0, y: 0 }},
          rawData: curr,
          path: currentPath
        }});

        if (parentId !== null) {{
          edgesArr.push({{
            from: parentId,
            to: myId,
            color: {{ color: 'rgba(148, 163, 184, 0.25)', highlight: '#38bdf8', hover: '#38bdf8' }},
            width: 1.5,
            smooth: {{ type: 'continuous' }}
          }});
        }}

        if (curr.children && curr.children.length > 0) {{
          curr.children.forEach(child => traverse(child, myId, currentPath));
        }}
      }}

      traverse(root);
      return {{ nodes: Array.from(nodesMap.values()), edges: edgesArr }};
    }}

    function initNetworkView() {{
      const container = document.getElementById('network-container');
      const data = processTreeData(initialJsonData);
      
      const options = {{
        nodes: {{ shape: 'dot' }},
        physics: {{
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {{
            gravitationalConstant: -38,
            centralGravity: 0.005,
            springLength: 80,
            springConstant: 0.18
          }},
          stabilization: {{ iterations: 150 }}
        }},
        interaction: {{ hover: true, tooltipDelay: 100, zoomView: true, dragView: true }}
      }};

      network = new vis.Network(container, {{ nodes: new vis.DataSet(data.nodes), edges: new vis.DataSet(data.edges) }}, options);
      visNodes = data.nodes;
      visEdges = data.edges;

      network.on("click", function (params) {{
        if (params.nodes.length > 0) {{
          const nodeObj = visNodes.find(n => n.id === params.nodes[0]);
          if (nodeObj) openDrawer(nodeObj);
        }}
      }});
    }}

    function switchView(viewName, evt) {{
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));

      if (evt) evt.currentTarget.classList.add('active');
      document.getElementById(`view-${{viewName}}`).classList.add('active');

      if (viewName === 'radial') renderRadialTree();
      else if (viewName === 'tree') renderD3Tree();
      else if (viewName === 'arch') renderArchGraph();
    }}

    function openDrawer(nodeObj) {{
      const drawer = document.getElementById('node-drawer');
      const title = document.getElementById('drawer-title');
      const type = document.getElementById('drawer-type');
      const path = document.getElementById('drawer-path');
      const count = document.getElementById('drawer-count');
      const childrenContainer = document.getElementById('drawer-children');

      title.innerText = nodeObj.label;
      path.innerText = nodeObj.path || nodeObj.label;
      count.innerText = nodeObj.value || (nodeObj.rawData?.total_count) || 1;
      type.innerText = nodeObj.label.includes('.ts') ? 'Archivo TS' : (nodeObj.label.includes('.') ? 'Archivo' : 'Módulo');
      
      childrenContainer.innerHTML = '';
      const children = nodeObj.rawData?.children || [];
      
      if (children.length === 0) {{
        childrenContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; padding:8px;">No hay sub-elementos</div>';
      }} else {{
        children.forEach(child => {{
          const item = document.createElement('div');
          item.className = 'child-item';
          item.innerHTML = `<span>${{child.name}}</span><span style="color:var(--cyan-accent); font-weight:600;">${{child.total_count || 1}}</span>`;
          childrenContainer.appendChild(item);
        }});
      }}

      drawer.classList.add('open');
    }}

    function closeDrawer() {{
      document.getElementById('node-drawer').classList.remove('open');
    }}

    function handleSearch(query) {{
      if (!query.trim()) return;
      const q = query.toLowerCase();
      const match = visNodes.find(n => n.label.toLowerCase().includes(q));
      if (match && network) {{
        network.focus(match.id, {{ scale: 1.2, animation: {{ duration: 800, easingFunction: 'easeInOutQuad' }} }});
        openDrawer(match);
      }}
    }}

    function resetZoom() {{
      if (network) network.fit({{ animation: {{ duration: 600 }} }});
    }}

    function togglePhysics() {{
      isPhysicsOn = !isPhysicsOn;
      if (network) network.setOptions({{ physics: {{ enabled: isPhysicsOn }} }});
      document.getElementById('physics-btn').innerText = `⚡ Física: ${{isPhysicsOn ? 'ON' : 'OFF'}}`;
    }}

    function renderRadialTree() {{
      const container = document.getElementById('radial-container');
      container.innerHTML = '';

      const width = container.clientWidth || 1200;
      const height = container.clientHeight || 800;
      const radius = Math.min(width, height) / 2 - 80;

      const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

      const root = d3.hierarchy(initialJsonData);
      tree(root);

      const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${{width / 2}},${{height / 2}})`);

      svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y))
        .attr("fill", "none")
        .attr("stroke", "rgba(56, 189, 248, 0.25)")
        .attr("stroke-width", 1.5);

      const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `rotate(${{d.x * 180 / Math.PI - 90}}) translate(${{d.y}},0)`);

      node.append("circle")
        .attr("r", d => Math.max(3, Math.min(10, Math.log2(d.data.total_count || 1) * 2)))
        .attr("fill", d => d.children ? "#38bdf8" : "#34d399")
        .attr("stroke", "#090d16")
        .attr("stroke-width", 1.5);

      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(d => d.data.name)
        .attr("fill", "#e2e8f0")
        .attr("font-size", "10px")
        .attr("font-family", "Inter");
    }}

    function renderD3Tree() {{
      const svg = d3.select("#tree-svg");
      svg.selectAll("*").remove();

      const root = d3.hierarchy(initialJsonData);
      const treeLayout = d3.tree().size([3500, 1600]);
      treeLayout(root);

      const g = svg.append("g").attr("transform", "translate(100, 40)");

      g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

      const node = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${{d.y}},${{d.x}})`)
        .on("click", (e, d) => openDrawer({{ label: d.data.name, rawData: d.data, value: d.data.total_count }}));

      node.append("circle")
        .attr("r", 6)
        .attr("fill", d => d.children ? "#38bdf8" : "#c084fc")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

      node.append("text")
        .attr("dx", d => d.children ? -10 : 10)
        .attr("dy", 4)
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name);
    }}

    function renderArchGraph() {{
      const container = document.getElementById('arch-container');
      container.innerHTML = '';

      if (!graphRelationsData.nodes || graphRelationsData.nodes.length === 0) {{
        container.innerHTML = '<div style="padding:40px; color:var(--text-muted); text-align:center;">No hay relaciones de arquitectura registradas.</div>';
        return;
      }}

      const nodes = graphRelationsData.nodes.map(n => ({{
        id: n.id,
        label: `${{n.id}}\\n(${{n.type}})`,
        shape: 'box',
        color: getColorForName(n.type),
        font: {{ color: '#fff', face: 'Inter' }}
      }}));

      const edges = graphRelationsData.edges.map(e => ({{
        from: e.source,
        to: e.target,
        label: e.relationship,
        font: {{ color: '#94a3b8', size: 10, strokeWidth: 0 }},
        arrows: 'to',
        color: {{ color: '#818cf8' }}
      }}));

      new vis.Network(container, {{ nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) }}, {{
        physics: {{ solver: 'forceAtlas2Based' }}
      }});
    }}

    window.onload = function() {{
      initNetworkView();
    }};
  </script>
</body>
</html>
'''

with open(html_path, "w", encoding="utf-8") as f:
    f.write(enhanced_html)

print("Enhanced GRAPH_TREE.html written successfully!")
