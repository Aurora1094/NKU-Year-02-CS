// ==== 系列2 · D3 饼图（Chart.js 风格 tooltip + 底部图例 + 动画） ====

// 把 label 变成安全的 class 名
function slugifyPie(name) {
  return String(name)
    .trim()
    .replace(/\s+|\//g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
}

// 确保有专用 tooltip（黑色小气泡）
function ensurePieTooltip() {
  let tooltip = d3.select('#pie-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('id', 'pie-tooltip');
  }
  // 初始化：隐藏 + 别带 visible
  tooltip
    .classed('visible', false)
    .style('opacity', null); // 交给 CSS 管理
  return tooltip;
}

// 在某个容器里画一张普通饼图
function renderSimplePie(config) {
  const { container, data, colors } = config;

  const root = d3.select(container);
  if (root.empty()) return;

  const tooltip = ensurePieTooltip();

  // ===== 尺寸：所有饼图统一用同一个 size =====
  const size = 520;                  // 想整体大一点/小一点改这个数字
  const radius = size / 2 - 6;

  const svg = root.append('svg')
    .attr('class', 'pie-svg')
    .attr('viewBox', `0 0 ${size} ${size}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width',  size + 'px')   // 强制实际宽度
    .style('height', size + 'px');  // 强制实际高度

  const g = svg.append('g')
    .attr('transform', `translate(${size / 2}, ${size / 2})`);

  const pie = d3.pie()
    .sort(null)
    .value(d => d.value);

  const arc = d3.arc()
    .innerRadius(0)          // 普通饼图（不是甜甜圈）
    .outerRadius(radius);

  const arcHover = d3.arc()
    .innerRadius(0)
    .outerRadius(radius + 4); // hover 略大一点

  const total = d3.sum(data, d => d.value);

  const arcsData = pie(data);

  const slices = g.selectAll('path.pie-slice')
    .data(arcsData)
    .enter()
    .append('path')
    .attr('class', d => 'pie-slice slice-' + slugifyPie(d.data.label))
    .attr('fill', (d, i) => colors[i] || '#ccc');

  // ==== 入场动画：每块饼图“一个一个长出来” ====
  slices
    .attr('d', d3.arc().innerRadius(0).outerRadius(0))
    .transition()
    .delay((d, i) => i * 90)   // 依次延迟，i=0,1,2,... 一块一块出现
    .duration(500)
    .attr('d', arc);

  // hover：放大，其他变淡 + 黑色气泡 tooltip 下翻出现
  slices
    .on('mouseover', function (event, d) {
      const thisSlice = d3.select(this);
      const idx = d.index;
      const fillColor = colors[idx] || '#ccc';
      const percent = (d.data.value / total * 100).toFixed(1);

      thisSlice
        .raise()
        .transition()
        .duration(150)
        .attr('d', arcHover(d));

      slices
        .filter(p => p !== d)
        .classed('dimmed', true);

      // tooltip 内容：标题 + 小色块 + 数值
      tooltip
        .html(`
          <div style="font-weight:600;margin-bottom:4px;">${d.data.label}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${fillColor};"></span>
            <span>${d.data.label}: ${percent}%</span>
          </div>
        `)
        .classed('visible', true);  // 让 CSS 控制从上往下“翻”出来

      // 放到当前鼠标位置附近
      tooltip
        .style('left', event.pageX + 'px')
        .style('top',  (event.pageY - 10) + 'px');
    })
    .on('mousemove', function (event) {
      // 跟着鼠标动
      tooltip
        .style('left', event.pageX + 'px')
        .style('top',  (event.pageY - 10) + 'px');
    })
    .on('mouseout', function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('d', arc(d));

      slices.classed('dimmed', false);

      tooltip.classed('visible', false);
    });

  // 图例：在容器下面加一条横向 legend（像 Chart.js legend 在底部）
  const legend = root.append('div')
    .attr('class', 'pie-legend');

  const legendItems = legend.selectAll('.pie-legend-item')
    .data(data)
    .enter()
    .append('div')
    .attr('class', 'pie-legend-item');

  legendItems.append('span')
    .attr('class', 'pie-legend-swatch')
    .style('background', (d, i) => colors[i] || '#ccc');

  legendItems.append('span')
    .text(d => d.label);
}

// DOM 加载完毕后画所有饼图
document.addEventListener('DOMContentLoaded', function () {
  const configs = [
    // 0. 总占比
  {
  container: '#pie-overall-canvas',
  data: [
    { label: '父母',      value: 5.30 },
    { label: '亲人',      value: 2.50 },
    { label: '朋友',      value: 9.57 },
    { label: '工作关系',  value: 18.90 },
    { label: '子女',      value: 6.04 },
    { label: '恋人配偶',  value: 16.30 },
    { label: '陌生人',    value: 14.14 },
    { label: '独处',      value: 27.25 },
  ],
  colors: [
    '#BF7567', // 父母：偏暖砖红，略比之前更柔
    '#E3B999', // 亲人：米杏色
    '#7FAFAD', // 朋友：灰青绿
    '#74889A', // 工作关系：钢灰蓝
    '#E8D79C', // 子女：淡奶油黄
    '#C68A9C', // 恋人配偶：灰玫瑰粉
    '#A096BD', // 陌生人：灰紫
    '#343642'  // 独处：深灰蓝，比 #30323A 略浅一点
  ]
},




    // 1. 父母（第一张）
    {
      container: '#pie-parents-canvas',
      data: [
        { label: '父母', value: 5.30 },
        { label: '其他', value: 94.70 },
      ],
      colors: ['#FF6B6B', '#F2F2F2']
    },

    // 2. 父母（第二张：在家时间 vs 不在家时间）
    {
      container: '#pie-parents2-canvas',
      data: [
        { label: '20岁前陪伴父母的时间',   value: 6 },
        { label: '20岁后陪伴父母的时间', value: 2.4 },
      ],
      colors: ['#F2F2F2','#7CA6A1',]
    },

    // 3. 朋友
    {
      container: '#pie-friends-canvas',
      data: [
        { label: '朋友', value: 9.57},
        { label: '其他', value: 90.43 },
      ],
      colors: ['#89cd4eff', '#F2F2F2']
    },

   // 4. 情侣 vs 配偶
{
  container: '#pie-couple-canvas',
  data: [
    { label: '恋人', value: 2.70 },
    { label: '配偶', value: 30.50 },
  ],
  colors: [
    '#E4A8B7', // 恋人：灰粉
    '#7F9ECF'  // 配偶：灰蓝
  ]
}
  ];

  configs.forEach(renderSimplePie);
});
