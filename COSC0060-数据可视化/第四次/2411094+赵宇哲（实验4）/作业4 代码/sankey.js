// ——— 基础配置 ———
const AGE_BINS = ["0–20","20–30","30–40","40–50","50–60","60–70","70–80"];

// 颜色映射：文艺且清透（在第一版基础上提亮，去除了过重的灰雾感）
const COLORS = {
  '父母': '#D97E6E',   // 陶红：比原版更红润温暖
  '亲人': '#EDC3A6',   // 杏色：更清爽的肤色调
  '朋友': '#8CCBC9',   // 青瓷：通透的蓝绿色
  '同事': '#859BB0',   // 黛蓝：清冷的灰蓝色
  '子女': '#F2DE9F',   // 麦黄：柔和明亮
  '配偶': '#DB96AA',   // 藕粉：浪漫但不艳俗
  '陌生人': '#B3A5D1', // 紫藤：淡雅的紫色
  '独处': '#454857'    // 墨灰：有质感的深色，不完全死黑
};
const COLOR = (cat) => COLORS[cat] || '#888';

// 用于图例的类别列表
const CATS = Object.keys(COLORS);
const active = new Set(CATS);

function initSankey() {
  const container = document.getElementById('sankey-chart');
  if (!container) return;
  container.innerHTML = ''; 

  const W = container.clientWidth || 800;
  const H = 550; 
  const margin = {top:40, right:120, bottom:40, left:40}; // left 减小，因为去掉了文字
  const width = W - margin.left - margin.right;
  const height = H - margin.top - margin.bottom;

  const svg = d3.select(container).append('svg')
    .attr('width', W)
    .attr('height', H);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // 1. 获取全局数据
  const timeData = (typeof DATA !== 'undefined') ? DATA : [];
  
  // 2. 自动计算排名数据 (nodes)
  const nodes = [];

  // 遍历每个年龄段
  AGE_BINS.forEach(age => {
    const row = timeData.find(d => d['年龄段'] === age);
    if (!row) return;

    // 提取该年龄段下所有类别的数值
    const temp = CATS.map(cat => ({
      name: cat,
      value: row[cat] || 0
    }));

    // 排序：值大的排名靠前 (Rank 1)
    temp.sort((a, b) => b.value - a.value);

    // 生成节点数据
    temp.forEach((item, index) => {
      nodes.push({
        name: item.name,
        age: age,
        rank: index + 1, // 索引0是第1名
        value: item.value,
        // 后面坐标系定好再计算 x, y
      });
    });
  });

  // 3. 定义坐标系
  const x = d3.scalePoint()
    .domain(AGE_BINS)
    .range([0, width])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([1, 8]) // 排名 1 到 8
    .range([0, height]);

  // 补充节点的 x, y 坐标和颜色
  nodes.forEach(n => {
    n.x = x(n.age);
    n.y = y(n.rank);
    n.color = COLOR(n.name);
  });

  // 宽度比例尺：根据时间占比映射线条粗细
  const thicknessScale = d3.scaleLinear()
    .domain([0, 0.5]) 
    .range([2, 36])
    .clamp(true);

  // 4. 绘制轴
  // X轴：保留
  g.append('g')
    .attr('transform', `translate(0, -10)`)
    .call(d3.axisTop(x).tickSize(0))
    .select('.domain').remove();
    
  // Y轴：去掉文字，只保留隐形的结构（或者完全不画）
  // 这里完全移除 Y 轴的绘制代码，因为不需要 "No.1" 了
  
  // 5. 绘制变宽连线 (Area Ribbons)
  const areaGen = d3.area()
    .x(d => d.x)
    .y0(d => d.y - thicknessScale(d.value) / 2)
    .y1(d => d.y + thicknessScale(d.value) / 2)
    .curve(d3.curveMonotoneX); 

  // 按类别分组
  const categories = CATS.map(cat => {
    return {
      name: cat,
      values: nodes.filter(n => n.name === cat).sort((a,b) => AGE_BINS.indexOf(a.age) - AGE_BINS.indexOf(b.age))
    };
  });

  const paths = g.selectAll('.rank-path')
    .data(categories)
    .join('path')
    .attr('class', 'rank-path')
    .attr('d', d => areaGen(d.values))
    .attr('fill', d => COLOR(d.name))
    .attr('fill-opacity', 0.5) // 稍微提高一点透明度，配合清透的颜色
    .attr('stroke', 'none')
    .style('transition', 'fill-opacity 0.3s')
    .on('mouseenter', function(e, d) {
      d3.selectAll('.rank-path').attr('fill-opacity', 0.1);
      d3.select(this).attr('fill-opacity', 0.95);
      
      d3.selectAll('.rank-node').attr('opacity', 0.1);
      d3.selectAll(`.node-${d.name}`).attr('opacity', 1);
    })
    .on('mouseleave', function() {
      d3.selectAll('.rank-path').attr('fill-opacity', 0.5);
      d3.selectAll('.rank-node').attr('opacity', 1);
      tooltip.style('opacity', 0);
    });


  // 6. 绘制节点：小饼图
  const NODE_RADIUS = 14;
  const arcGen = d3.arc()
    .innerRadius(0)
    .outerRadius(NODE_RADIUS);

  const nodeGroups = g.selectAll('.rank-node')
    .data(nodes)
    .join('g')
    .attr('class', d => `rank-node node-${d.name}`)
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .style('cursor', 'pointer');

  // 饼图底色
  nodeGroups.append('circle')
    .attr('r', NODE_RADIUS)
    .attr('fill', '#f7f7f7') // 稍微亮一点的底色
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);

  // 时间占比扇形
  nodeGroups.append('path')
    .attr('d', d => {
      return arcGen({
        startAngle: 0,
        endAngle: 2 * Math.PI * d.value
      });
    })
    .attr('fill', d => d.color);
  
  // 节点外圈
  nodeGroups.append('circle')
    .attr('r', NODE_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1.5)
    .attr('opacity', 0.6);


  // 7. 交互 Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'sankey-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(255, 255, 255, 0.95)') // 改为浅色背景 tooltip，更文艺
    .style('color', '#333')
    .style('padding', '8px 12px')
    .style('border', '1px solid #eee')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
    .style('z-index', 999);

  nodeGroups.on('mouseenter', function(event, d) {
    const percent = (d.value * 100).toFixed(1);

    tooltip.html(`
      <div style="font-weight:bold; margin-bottom:4px; color:${d.color}; font-size:14px">${d.name}</div>
      <div><span style="color:#999">年龄段:</span> ${d.age}</div>
      <div><span style="color:#999">排名:</span> 第 ${d.rank}</div>
      <div style="margin-top:2px"><span style="color:#999">时间投入:</span> <span style="font-weight:bold">${percent}%</span></div>
    `)
      .style('opacity', 1)
      .style('left', (event.pageX + 12) + 'px')
      .style('top', (event.pageY - 20) + 'px');
      
    d3.selectAll('.rank-path').attr('fill-opacity', 0.1);
    d3.selectAll('.rank-path').filter(p => p.name === d.name).attr('fill-opacity', 0.95);
    
    d3.selectAll('.rank-node').attr('opacity', 0.2);
    d3.selectAll(`.node-${d.name}`).attr('opacity', 1);
  })
  .on('mousemove', function(event) {
    tooltip
      .style('left', (event.pageX + 12) + 'px')
      .style('top', (event.pageY - 20) + 'px');
  })
  .on('mouseleave', function() {
    tooltip.style('opacity', 0);
    d3.selectAll('.rank-path').attr('fill-opacity', 0.5);
    d3.selectAll('.rank-node').attr('opacity', 1);
  });


  // 8. 图例
  const legend = d3.select(container).append('div')
    .attr('class', 'legend')
    .style('margin-top', '12px');

  CATS.forEach(cat => {
    const item = legend.append('div')
      .attr('class', 'legend-item')
      .style('cursor', 'pointer')
      .style('opacity', 1)
      .on('click', function() {
        const isActive = d3.select(this).style('opacity') == 1;
        d3.selectAll('.legend-item').style('opacity', 0.4);
        d3.selectAll('.rank-path').attr('display', 'none');
        d3.selectAll('.rank-node').attr('display', 'none');

        if (isActive && active.size === 1 && active.has(cat)) {
           active.clear();
           CATS.forEach(c => active.add(c));
           d3.selectAll('.legend-item').style('opacity', 1);
           d3.selectAll('.rank-path').attr('display', null);
           d3.selectAll('.rank-node').attr('display', null);
        } else {
           active.clear();
           active.add(cat);
           d3.select(this).style('opacity', 1);
           d3.selectAll('.rank-path').filter(d => d.name === cat).attr('display', null);
           d3.selectAll(`.node-${cat}`).attr('display', null);
        }
      });

    item.append('span')
      .style('display', 'inline-block')
      .style('width', '12px')
      .style('height', '12px')
      .style('background', COLOR(cat))
      .style('margin-right', '6px')
      .style('border-radius', '50%');

    item.append('span')
      .text(cat)
      .style('font-size', '13px')
      .style('color', '#666');
  });
}

setTimeout(initSankey, 100);
window.addEventListener('resize', initSankey);