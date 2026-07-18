// ===== 数据保持不变 =====
const DATA = [
  {"年龄段":"0–20","父母":0.2804,"亲人":0.0234,"朋友":0.1168,"同事":0.0374,"子女":0.0,"配偶":0.014,"陌生人":0.1308,"独处":0.3972},
  {"年龄段":"20–30","父母":0.046,"亲人":0.0184,"朋友":0.1534,"同事":0.2301,"子女":0.0613,"配偶":0.1012,"陌生人":0.1442,"独处":0.2454},
  {"年龄段":"30–40","父母":0.0138,"亲人":0.0165,"朋友":0.0964,"同事":0.1928,"子女":0.1377,"配偶":0.168,"陌生人":0.1185,"独处":0.2562},
  {"年龄段":"40–50","父母":0.0059,"亲人":0.0206,"朋友":0.0735,"同事":0.2059,"子女":0.1176,"配偶":0.1882,"陌生人":0.1206,"独处":0.2676},
  {"年龄段":"50–60","父母":0.0034,"亲人":0.0276,"朋友":0.069,"同事":0.2483,"子女":0.0345,"配偶":0.2172,"陌生人":0.1414,"独处":0.2586},
  {"年龄段":"60–70","父母":0.00199,"亲人":0.03579,"朋友":0.07952,"同事":0.13917,"子女":0.00795,"配偶":0.22664,"陌生人":0.17097,"独处":0.33797},
  {"年龄段":"70–80","父母":0.00219,"亲人":0.04376,"朋友":0.08753,"同事":0.04814,"子女":0.00438,"配偶":0.22319,"陌生人":0.19694,"独处":0.39387}
];

(function () {
  const container = document.getElementById('stream-chart');
  const tooltip = d3.select('#stream-tooltip');

  const ages = DATA.map(d => d["年龄段"]);
  const ALL_KEYS = Object.keys(DATA[0]).filter(k => k !== "年龄段");
  const active = new Set(ALL_KEYS);

  const color = d3.scaleOrdinal()
    .domain(ALL_KEYS)
    .range(d3.schemeTableau10.concat(d3.schemeSet3).slice(0, ALL_KEYS.length));

  const legend = d3.select('#stream-legend');
  const items = legend.selectAll('div.item')
    .data(ALL_KEYS)
    .join('div')
    .attr('class', d => 'item' + (active.has(d) ? '' : ' off'))
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-pressed', d => active.has(d))
    .attr('title','点击切换；Alt+点击或双击=只看/还原')
    .html(d => `<span class="swatch" style="background:${color(d)}"></span><span class="label">${d}</span>`)
    .on('click', (ev, d) => toggleKey(d, {solo: ev.altKey}))
    .on('dblclick', (ev, d) => toggleKey(d, {solo: true}))
    .on('keydown', (ev, d) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleKey(d, {solo: ev.altKey}); }
    });

  function updateLegend() {
    items.classed('off', d => !active.has(d)).attr('aria-pressed', d => active.has(d));
  }

  function toggleKey(key, {solo=false} = {}) {
    if (solo) {
      if (active.size === 1 && active.has(key)) { ALL_KEYS.forEach(k => active.add(k)); }
      else { active.clear(); active.add(key); }
    } else {
      if (active.has(key)) { if (active.size === 1) return; active.delete(key); }
      else { active.add(key); }
    }
    updateLegend(); draw();
  }

  function draw() {
    const width = container.clientWidth || 960;
    const height = Math.max(420, Math.round(width * 0.5));
    const margin = { top: 20, right: 24, bottom: 36, left: 24 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const keys = ALL_KEYS.filter(k => active.has(k));
    const stack = d3.stack().keys(keys).order(d3.stackOrderInsideOut).offset(d3.stackOffsetWiggle);
    const series = stack(DATA);

    const x = d3.scalePoint().domain(ages).range([0, innerW]).padding(0.5);
    const y = d3.scaleLinear()
      .domain([ d3.min(series, s => d3.min(s, d => d[0])),
                d3.max(series, s => d3.max(s, d => d[1])) ])
      .range([innerH, 0]).nice();

    const area = d3.area()
      .x((d, i) => x(ages[i])).y0(d => y(d[0])).y1(d => y(d[1]))
      .curve(d3.curveCatmullRom.alpha(0.5));

    d3.select('#stream-chart').selectAll('svg').remove();
    const svg = d3.select('#stream-chart').append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const layer = g.append('g').selectAll('path.layer')
      .data(series, d => d.key).join('path')
      .attr('class', 'layer').attr('d', area)
      .attr('fill', d => color(d.key)).attr('fill-opacity', 0.9).attr('stroke', 'none')
      .style('cursor','pointer')
      .on('click', (ev, d) => toggleKey(d.key, {solo: ev.altKey}))
      .on('dblclick', (ev, d) => toggleKey(d.key, {solo: true}));

    

    layer.on('mousemove', function (event, d) {
      const [mx] = d3.pointer(event);
      const i = d3.leastIndex(ages, a => Math.abs(x(a) - mx));
      const age = ages[i]; const value = DATA[i][d.key];
      layer.attr('fill-opacity', p => (p.key === d.key ? 1 : 0.35));
      tooltip.style('opacity', 1).style('left', (event.pageX + 12) + 'px').style('top', (event.pageY + 12) + 'px')
        .html(`<strong>${d.key}</strong><br/>${age}：${(value * 100).toFixed(1)}%`);
    }).on('mouseleave', function () {
      layer.attr('fill-opacity', 0.9); tooltip.style('opacity', 0);
    });
  }

  draw();
  window.addEventListener('resize', () => draw());
})();
