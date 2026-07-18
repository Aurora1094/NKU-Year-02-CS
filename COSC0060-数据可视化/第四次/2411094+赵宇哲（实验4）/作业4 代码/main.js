/************ 配置区 ************/
const CONFIG = {
  binSizeHours: 2,
  innerBase: 40,
  maxR: 380,
  bandThickness: 12,
  anglePad: 0.06,
  sectorSplitOvershoot: 4,
  edgeLabelOffset: 20,

  // 刻度：自动挑选好看的圈刻度；两图共用同一半径便于对比
  useAutoTicks: true,
  ringTickStep: 10,          // useAutoTicks=false 时使用
  ringLabelAngle: -Math.PI/2,
  ringLabelInset: 6,

  tooltipFields: ["sector","date","minutes"],
  useSharedRadius: true,

  xhsCsvPath: "assets/xhs_6days.csv",
  wxCsvPath:  "assets/wechat_6days.csv",
};

/************ 工具 ************/
const pad = (n) => String(n).padStart(2,'0');

// 仅影响底图“扇区标签”的显示：+6 小时；0 显示为 24:00
function sectorLabel(h){
  const t = (h + 6) % 24;
  return (t === 0 ? "24" : pad(t)) + ":00";
}

// 返回 "周日/周一/.../周六"
function chineseWeekday(dow){ return ["周日","周一","周二","周三","周四","周五","周六"][dow]; }

// 支持 "YYYY-MM-DD" 或可被 Date 识别的字符串
function weekdayOfDateString(dateStr){
  const d = new Date(String(dateStr).trim() + "T00:00:00");
  return isNaN(d) ? "" : chineseWeekday(d.getDay());
}


function makeDiscreteGradient(dates, startColor, endColor, easePower=1.0){
  const n = dates.length;
  const interp = d3.interpolateCubehelixLong(startColor, endColor);
  const tOfIdx = d3.scalePow().exponent(easePower).domain([0, n-1]).range([0, 1]);
  const palette = dates.map((_, i) => interp(tOfIdx(i)));
  const map = new Map(dates.map((d,i)=>[d, palette[i]]));
  return (dt)=> map.get(dt);
}
const colorXHSFactory = (dates) => makeDiscreteGradient(dates, "#6e0f0f", "#ffb3a8", 1.0);
const colorWXFactory  = (dates) => makeDiscreteGradient(dates, "#0a3a2a", "#bcf3c9", 1.1);

/************ CSV 读取（健壮版） ************/
function parseDateLoose(s){
  if(!s) return null;
  const t = String(s).trim();
  const m = t.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if(m){ const y=+m[1], mo=+m[2], d=+m[3]; return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  return t;
}
async function loadCsv(path){
  const txt = await d3.text(path);
  const firstLine = txt.split(/\r?\n/)[0] || "";
  const delimiter = (firstLine.includes("\t")) ? "\t" : ",";
  const parse = delimiter === "\t" ? d3.tsvParse : d3.csvParse;
  const table = parse(txt);
  const norm = (s) => String(s || "").trim().toLowerCase();
  const cols = table.columns.map(norm);
  const idx = {
    date: cols.findIndex(c => ["date","日期"].includes(c)),
    hour: cols.findIndex(c => ["hour","小时"].includes(c)),
    minutes: cols.findIndex(c => ["minutes","分钟","用时(分钟)","用时","时长","总分钟"].includes(c)),
  };
  if(idx.date<0 || idx.hour<0 || idx.minutes<0){
    throw new Error(`找不到需要的列。检测到表头：${table.columns.join(" | ")}`);
  }
  return table.map(r=>{
    const keys = table.columns, get = (i)=> r[keys[i]];
    return {
      date: parseDateLoose(get(idx.date)),
      hour: +String(get(idx.hour)).trim(),
      minutes: +String(String(get(idx.minutes)).trim().replace(",", "."))
    };
  }).filter(d => d.date && Number.isFinite(d.hour) && Number.isFinite(d.minutes));
}

// file:// 回退（手选 CSV）
function loadCsvFromFile(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => {
      try{
        let txt = String(reader.result || "");
        if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
        txt = txt.replace(/\r\n?/g, "\n");
        const firstLine = (txt.split("\n")[0] || "");
        const delimiter = firstLine.includes("\t") ? "\t" : ",";
        const commaCount = (firstLine.match(/,/g)||[]).length;
        const semiCount  = (firstLine.match(/;/g)||[]).length;
        const realDelimiter = semiCount > commaCount ? ";" : delimiter;
        const parse = d3.dsvFormat(realDelimiter).parse;
        const table = parse(txt);
        const norm = (s) => String(s || "").trim().toLowerCase();
        const cols = table.columns.map(norm);
        const idx = {
          date: cols.findIndex(c => ["date","日期"].includes(c)),
          hour: cols.findIndex(c => ["hour","小时"].includes(c)),
          minutes: cols.findIndex(c => ["minutes","分钟","用时(分钟)","用时","时长","总分钟"].includes(c)),
        };
        if (idx.date<0 || idx.hour<0 || idx.minutes<0) {
          throw new Error(`找不到需要的列。检测到表头：${table.columns.join(" | ")}`);
        }
        const rows = table.map(r=>{
          const get = (i)=> r[table.columns[i]];
          const rawDate = String(get(idx.date) ?? "").trim();
          const m = rawDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          const date = m ? `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}` : rawDate;
          const hour = Number(String(get(idx.hour)).trim());
          const minutes = Number(String(get(idx.minutes)).trim().replace(",", "."));
          return { date, hour, minutes };
        }).filter(d => d.date && Number.isFinite(d.hour) && Number.isFinite(d.minutes));
        resolve(rows);
      } catch (e) {
        console.error("loadCsvFromFile parse error:", e);
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

/************ 刻度生成（自动/固定） ************/
function buildTicks(maxMinutes){
  if(!CONFIG.useAutoTicks){
    const step = CONFIG.ringTickStep;
    const maxTick = Math.ceil(maxMinutes / step) * step;
    return d3.range(step, maxTick + 1, step).filter(v => v>0 && v<=maxMinutes);
  }
  const candidates = d3.ticks(0, maxMinutes, 7).filter(v=>v>0);
  const first = candidates[0] ?? 5;
  if(first < 5) return candidates.filter(v => v % 5 === 0);
  return candidates;
}

/************ 绘图（0:00 在上；底图标签 +6h） ************/
function renderPolarDays({ svgSelector, legendSelector, appName, data, colorByDateFactory, sharedMax=null }){
  const clean = data.filter(d => d.minutes > 0 && d.hour>=0 && d.hour<=23);
  const svg = d3.select(svgSelector);
  const g = svg.append('g');
  const tooltip = d3.select('#tooltip');

  const binsCount = Math.floor(24 / CONFIG.binSizeHours);
  const bins = d3.range(binsCount);
  const dates = Array.from(new Set(clean.map(d=>d.date))).sort();

  const localMax = d3.max(clean, d=>d.minutes) || 60;
  const maxMinutes = sharedMax ?? localMax;

  const angle = d3.scaleBand().domain(bins).range([-Math.PI/2, 1.5*Math.PI]).paddingInner(0.08);
  const r = d3.scaleLinear().domain([0, maxMinutes]).range([CONFIG.innerBase, CONFIG.maxR]).clamp(true);
  const colorByDate = colorByDateFactory(dates);


g.append('circle')
  .attr('class', 'disk-bg')
  .attr('r', CONFIG.maxR + CONFIG.bandThickness/2) // 半径略大于最外圈
  .attr('fill', '#ffffffff')      // 底色（改成你想要的色）
  .attr('opacity', 1)           // 也可用 0.9~0.98
  .attr('pointer-events', 'none');





  // 同心环 + 文本
  const tickVals = buildTicks(maxMinutes);
  const rings = g.append('g');
  rings.selectAll('circle')
    .data(tickVals).join('circle')
  .attr('class','ring')
  .attr('r', d => r(d))
  .attr('fill','none')
  .attr('stroke','#e5e7eb')       // 浅灰
  .attr('stroke-width',1.8)       // ← 加粗
  .attr('stroke-dasharray','4 6') // ← 更“重”的虚线
  .attr('stroke-linecap','round')
  .attr('vector-effect','non-scaling-stroke'); // 缩放不变细

  rings.selectAll('text')
  .data(tickVals).join('text')
  .attr('class','ring-label')
  .attr('text-anchor','middle')
  .attr('x', d => Math.cos(CONFIG.ringLabelAngle) * (r(d) - CONFIG.ringLabelInset))
  .attr('y', d => Math.sin(CONFIG.ringLabelAngle) * (r(d) - CONFIG.ringLabelInset))
  .attr('dy', -1)
  .text(d => `${Math.round(d)} min`)
  .style('font-size','18px')      // ← 放大这里
  .style('font-weight','600');    // 可选


  g.append('circle').attr('class','center-dot').attr('r', 3);

  // 分割线 + 底图时刻标签（+6h）
  const split = g.append('g').attr('aria-label','sector splits');
  const edges = bins.map(b => angle(b));
  split.selectAll('line').data(edges).join('line')
  .attr('class','sector-split')
  .attr('x1', a => Math.cos(a)*(CONFIG.innerBase-6))
  .attr('y1', a => Math.sin(a)*(CONFIG.innerBase-6))
  .attr('x2', a => Math.cos(a)*(CONFIG.maxR + CONFIG.sectorSplitOvershoot))
  .attr('y2', a => Math.sin(a)*(CONFIG.maxR + CONFIG.sectorSplitOvershoot))
  .attr('stroke', '#cbd5e1')
  .attr('stroke-width', 2.2)          // ← 加粗这里
  .attr('stroke-dasharray', '6 6')    // 若要虚线更“重”
  .attr('stroke-linecap', 'round')    // 端头圆润
  .attr('vector-effect','non-scaling-stroke'); // 缩放不变细

  const labelRadius = CONFIG.maxR + CONFIG.edgeLabelOffset;
  split.selectAll('text')
    .data(bins.map(b => ({ a: angle(b), h: b*CONFIG.binSizeHours })))
    .join('text')
    .attr('class','edge-label')
    .attr('text-anchor','middle')
    .attr('transform', d => `translate(${Math.cos(d.a)*labelRadius},${Math.sin(d.a)*labelRadius})`)
    .text(d => sectorLabel(d.h))
    .style('font-size','18px')   // ← 放大
  .style('font-weight','600')  // 可选
  .attr('paint-order','stroke')
  .attr('stroke','white')
  .attr('stroke-width',3);

  // 扇形
  const withBin = clean.map(d => ({...d, bin: Math.floor(d.hour/CONFIG.binSizeHours)}));
  const arc = d3.arc().cornerRadius(2);
 g.selectAll('.arc')
  .data(withBin.slice().sort((a,b)=> d3.ascending(a.bin, b.bin) || d3.ascending(a.minutes, b.minutes)))
  .join('path')
  .attr('class','arc')
  .attr('fill', d => colorByDate(d.date))
  .attr('stroke','none')                 // ← 不要描边（去黑边关键）
  .attr('d', d => {
    const a0 = angle(d.bin) + CONFIG.anglePad/2;
    const a1 = angle(d.bin) + angle.bandwidth() - CONFIG.anglePad/2;
    const rc = r(d.minutes);
    return arc({ startAngle:a0, endAngle:a1, innerRadius: rc - CONFIG.bandThickness/2, outerRadius: rc + CONFIG.bandThickness/2 });
  })
  .on('pointerenter', function(event, d){
    // d3.select(this).attr('stroke-width',3);  // ← 删除
    const bStart = d.bin*CONFIG.binSizeHours;
    const week = weekdayOfDateString(d.date);
    d3.select(this).style('filter','brightness(1.15)');  // ← 用亮度高亮
    const html = `
      <div><strong>${appName}</strong></div>
      <div>扇区：${pad(bStart)}:00–${pad(bStart+CONFIG.binSizeHours-1)}:59</div>
      <div>日期：${d.date}</div>
      <div>星期：${week}</div>
      <div>用时：${d.minutes.toFixed(2)} 分钟</div>
    `;
    tooltip.style('display','block').html(html);
  })
  .on('pointermove', (event)=>{
    tooltip.style('left', (event.clientX+14)+'px').style('top', (event.clientY+14)+'px');
  })
  .on('pointerleave', function(){
    // d3.select(this).attr('stroke-width',2);  // ← 删除
    d3.select(this).style('filter',null);       // ← 还原
    tooltip.style('display','none');
  });








//注释1



    // —— 微信 12–14 扇区注释（BEGIN）——
if (appName === '微信') {
  const bin = Math.floor(6 / CONFIG.binSizeHours);        // 12:00–13:59 对应的 bin
  const a0 = angle(bin) + CONFIG.anglePad/2;
  const a1 = angle(bin) + angle.bandwidth() - CONFIG.anglePad/2;
  const amid = (a0 + a1) / 2;                              // 扇区中心角

  // 让标注略微偏右（更“避让”中心标签），更美观
  const a = amid + 0.06;

  const rArc  = r(maxMinutes);
  const rFrom = rArc + CONFIG.bandThickness/2 + 2;         // 起点在扇形外沿略外
  const rKnee = Math.min(CONFIG.maxR - 6, rFrom + 22);     // 折点半径
  const rText = CONFIG.maxR + CONFIG.edgeLabelOffset + 26; // 文本半径

  const x0 = Math.cos(a) * rFrom, y0 = Math.sin(a) * rFrom;
  const xK = Math.cos(a) * rKnee, yK = Math.sin(a) * rKnee;
  const xT = Math.cos(a) * rText, yT = Math.sin(a) * rText;

  // 保证注释在最上层
  const annot = g.append('g').attr('class', 'annotation');

  

  // 连接线（两段折线）
  annot.append('line')
    .attr('x1', x0).attr('y1', y0)
    .attr('x2', xK).attr('y2', yK)
    .attr('stroke', '#666').attr('stroke-width', 1.4);

  annot.append('line')
    .attr('x1', xK).attr('y1', yK)
    .attr('x2', xT).attr('y2', yT)
    .attr('stroke', '#666').attr('stroke-width', 1.2);

  // 文本（带白色描边“光晕”，避免与背景色撞色）
  annot.append('text')
    .attr('x', xT).attr('y', yT).attr('dy', '0.32em')
    .attr('text-anchor', Math.cos(a) >= 0 ? 'start' : 'end')
    .attr('class', 'annotation-label')
    .text('午间聊天高发期');
}
// —— 微信 12–14 扇区注释（END）——










//注释2
// —— 微信 14–16 扇区注释（BEGIN）——
if (appName === '微信') {
  const bin2 = Math.floor(14 / CONFIG.binSizeHours);      // 14:00–15:59 对应的 bin
  const a0b = angle(bin2) + CONFIG.anglePad/2;
  const a1b = angle(bin2) + angle.bandwidth() - CONFIG.anglePad/2;
  const amidb = (a0b + a1b) / 2;

  // 略向左偏，和 6–8 的注释错开一点
  const a2 = amidb - 0.06;

  const rArc2  = r(maxMinutes);
  const rFrom2 = rArc2 + CONFIG.bandThickness/2 + 2;
  const rKnee2 = Math.min(CONFIG.maxR - 10, rFrom2 + 18);
  const rText2 = CONFIG.maxR +36;                         // 往内收，防止被 SVG 边界裁切

  const x0b = Math.cos(a2) * rFrom2, y0b = Math.sin(a2) * rFrom2;
  const xKb = Math.cos(a2) * rKnee2, yKb = Math.sin(a2) * rKnee2;
  const xTb = Math.cos(a2) * rText2, yTb = Math.sin(a2) * rText2;

  const annot2 = g.append('g').attr('class', 'annotation');

 
  annot2.append('line')
    .attr('x1', x0b).attr('y1', y0b)
    .attr('x2', xKb).attr('y2', yKb)
    .attr('stroke', '#666').attr('stroke-width', 1.4);

  annot2.append('line')
    .attr('x1', xKb).attr('y1', yKb)
    .attr('x2', xTb).attr('y2', yTb)
    .attr('stroke', '#666').attr('stroke-width', 1.2);

  annot2.append('text')
    .attr('x', xTb).attr('y', yTb).attr('dy', '0.32em')
    .attr('text-anchor', Math.cos(a2) >= 0 ? 'start' : 'end')
    .attr('class', 'annotation-label')
    .text('第二波夜谈活跃期');
}
// —— 微信 14–16 扇区注释（END）——








//注释3
// —— 小红书 12–14 扇区注释（BEGIN）——
if (appName === '小红书') {
  const bin   = Math.floor(16 / CONFIG.binSizeHours);     // 12:00–13:59
  const a0    = angle(bin) + CONFIG.anglePad/2;
  const a1    = angle(bin) + angle.bandwidth() - CONFIG.anglePad/2;
  const amid  = (a0 + a1) / 2;

  // 角度微调：略向右偏，避让中心标签
  const a = amid + 0.06;
  const dirX = Math.cos(a), dirY = Math.sin(a);

  // 半径：文字略往内，避免被 SVG 边界裁切
  const rArc  = r(maxMinutes);
  const rFrom = rArc + CONFIG.bandThickness/2 +10;  // 线起点：扇形外沿略外
  const rKnee = Math.min(CONFIG.maxR - 10, rFrom + 18);
  const rText = CONFIG.maxR +50;                   // 文字半径（需更外可加大）

  // 线头与文字的间隔；沿切向侧移（px）
  const labelPad = 8;
  const tangent  = 0;

  // 坐标
  const x0  = dirX * rFrom, y0  = dirY * rFrom;     // 起点
  const xK  = dirX * rKnee, yK  = dirY * rKnee;     // 折点
  const xT  = dirX * rText - dirY * tangent;        // 文字
  const yT  = dirY * rText + dirX * tangent;
  const xEnd = xT - dirX * labelPad;                // 第二段线终点（文字前）
  const yEnd = yT - dirY * labelPad;

  const annot = g.append('g').attr('class', 'annotation');

  // 外沿 → 折点
  annot.append('line')
    .attr('x1', x0).attr('y1', y0)
    .attr('x2', xK).attr('y2', yK)
    .attr('stroke', '#666').attr('stroke-width', 1.4)
    .attr('stroke-linecap', 'round');

  // 折点 → 文字前
  annot.append('line')
    .attr('x1', xK).attr('y1', yK)
    .attr('x2', xEnd).attr('y2', yEnd)
    .attr('stroke', '#666').attr('stroke-width', 1.2)
    .attr('stroke-linecap', 'round');

  // 文本
 const text = annot.append('text')
  .attr('x', xT).attr('y', yT)
  .attr('text-anchor', dirX >= 0 ? 'start' : 'end')
  .attr('class', 'annotation-label');

['羡慕世界精彩纷呈', '回顾自身一事无成'].forEach((ln, i) => {
  text.append('tspan')
    .attr('x', xT)
    .attr('dy', i === 0 ? '0.32em' : '1.2em') // 行距可调：1.1em~1.4em
    .text(ln);
});
}
// —— 小红书 12–14 扇区注释（END）——







//注释4
// —— 小红书 18–20 扇区注释（BEGIN）——
if (appName === '小红书') {
  const bin  = Math.floor(18 / CONFIG.binSizeHours);  // 18:00–19:59
  const a0   = angle(bin) + CONFIG.anglePad/2;
  const a1   = angle(bin) + angle.bandwidth() - CONFIG.anglePad/2;
  const amid = (a0 + a1) / 2;

  // 角度微调（可改）：顺时针为正、逆时针为负
  const a = amid + 0.04;
  const dirX = Math.cos(a), dirY = Math.sin(a);

  // 半径与间距（可改）：文字略往内，避免被裁；线头与文字留 8px
  const rArc  = r(maxMinutes);
  const rFrom = rArc + CONFIG.bandThickness/2 + 2;   // 线起点（外沿略外）
  const rKnee = Math.min(CONFIG.maxR - 10, rFrom - 136);
  const rText = CONFIG.maxR +26;                     // 文字半径
  const labelPad = 8;
  const tangent  = 0;                                 // 沿切向侧移（>0 右、<0 左）

  // 坐标
  const x0 = dirX * rFrom, y0 = dirY * rFrom;
  const xK = dirX * rKnee, yK = dirY * rKnee;
  const xT = dirX * rText - dirY * tangent;
  const yT = dirY * rText + dirX * tangent;
  const xEnd = xT - dirX * labelPad;
  const yEnd = yT - dirY * labelPad;

  const annot = g.append('g').attr('class', 'annotation');

  // 外沿 → 折点
  annot.append('line')
    .attr('x1', x0).attr('y1', y0)
    .attr('x2', xK).attr('y2', yK)
    .attr('stroke', '#666').attr('stroke-width', 1.4)
    .attr('stroke-linecap', 'round');

  // 折点 → 文字前
  annot.append('line')
    .attr('x1', xK).attr('y1', yK)
    .attr('x2', xEnd).attr('y2', yEnd)
    .attr('stroke', '#666').attr('stroke-width', 1.2)
    .attr('stroke-linecap', 'round');

 // 文本（单行）
annot.append('text')
  .attr('x', xT).attr('y', yT).attr('dy', '0.32em')
  .attr('text-anchor', dirX >= 0 ? 'start' : 'end')
  .attr('class', 'annotation-label')
  .text('迎接周一emo期');   // ← 换成你的文案

}
// —— 小红书 18–20 扇区注释（END）——












// ===== 图例（点击过滤显示）=====

// 兜底：如果没定义 weekdayOfDateString，就给一个简单版
if (typeof weekdayOfDateString !== 'function') {
  function weekdayOfDateString(dateStr){
    const d = new Date(String(dateStr).trim() + "T00:00:00");
    const names = ["周日","周一","周二","周三","周四","周五","周六"];
    return isNaN(d) ? "" : names[d.getDay()];
  }
}

const leg = d3.select(legendSelector);

// 给每个弧打上 data-attr，便于过滤（一定要在弧创建之后执行）
g.selectAll('.arc').attr('data-date', d => d.date);

// 选中集合（空 = 全部显示）
const selected = new Set();

// 更新可见性
function updateVisibility() {
  const showAll = selected.size === 0;
  g.selectAll('.arc')
    .style('opacity', d => (showAll || selected.has(d.date)) ? 1 : 0.08);

  leg.selectAll('.legend-item')
    .classed('active', function(){
      const dt = d3.select(this).datum();
      return selected.size === 0 || selected.has(dt);
    })
    .classed('dim', function(){
      const dt = d3.select(this).datum();
      return selected.size > 0 && !selected.has(dt);
    });
}

// 先清空旧图例，避免和旧代码叠加
leg.selectAll('*').remove();

// 用数据绑定创建图例项
leg.selectAll('.legend-item')
  .data(dates, d => d)
  .join(enter => {
    const item = enter.append('div')
      .attr('class','legend-item')
      .style('cursor','pointer');

    item.append('span')
      .attr('class','swatch')
      .style('background', d => colorByDate(d));

   item.append('span')
  .text(d => d);


    // 点击：单选/恢复；Ctrl/⌘ 支持多选
    item.on('click', (event, dt) => {
      try{
        if (event.metaKey || event.ctrlKey) {
          if (selected.has(dt)) selected.delete(dt); else selected.add(dt);
        } else {
          if (selected.size === 1 && selected.has(dt)) selected.clear();
          else { selected.clear(); selected.add(dt); }
        }
        updateVisibility();
      } catch(e){
        console.error('Legend click error:', e);
      }
    });

    return item;
  });

updateVisibility();
}



/************ 主流程：服务器 / 本地文件两种模式 ************/
function renderWithData(dataXHS, dataWX){
  let sharedMax = null;
  if (CONFIG.useSharedRadius) {
    const maxX = d3.max(dataXHS, d=>d.minutes) || 60;
    const maxW = d3.max(dataWX,  d=>d.minutes) || 60;
    sharedMax = Math.max(maxX, maxW);
  }
  renderPolarDays({ svgSelector:'#svg-xhs',    legendSelector:'#legend-xhs',    appName:'小红书', data:dataXHS, colorByDateFactory: colorXHSFactory, sharedMax });
  renderPolarDays({ svgSelector:'#svg-wechat', legendSelector:'#legend-wechat', appName:'微信',   data:dataWX,  colorByDateFactory: colorWXFactory,  sharedMax });
}

if (location.protocol === "file:") {
  document.getElementById('filepick').style.display = 'flex';
  const xhsInput = document.getElementById("xhs-file");
  const wxInput  = document.getElementById("wx-file");
  async function tryRender(){
    if(xhsInput.files.length && wxInput.files.length){
      const [dataXHS, dataWX] = await Promise.all([
        loadCsvFromFile(xhsInput.files[0]),
        loadCsvFromFile(wxInput.files[0])
      ]);
      renderWithData(dataXHS, dataWX);
    }
  }
  xhsInput.addEventListener('change', tryRender);
  wxInput.addEventListener('change', tryRender);
} else {
  Promise.all([ loadCsv(CONFIG.xhsCsvPath), loadCsv(CONFIG.wxCsvPath) ])
    .then(([dataXHS, dataWX]) => { renderWithData(dataXHS, dataWX); })
    .catch(err => {
      const hint = (location.protocol === "file:")
        ? "（你当前是 file:// 打开，请改用本地服务器，例如 VSCode Live Server 或 python -m http.server）"
        : "";
      alert("数据加载失败：" + (err && err.message ? err.message : err) + "\n请检查 assets/ 下的 CSV 文件名与格式（需要列：date/hour/minutes）" + hint);
    });
}
