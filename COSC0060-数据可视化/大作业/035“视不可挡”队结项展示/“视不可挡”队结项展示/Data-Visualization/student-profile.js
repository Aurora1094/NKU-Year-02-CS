// student-profile.js
(function () {
  'use strict';

  // =================== 这块是新加的：提交日志全局状态 ===================
  const SubmitProfileState = {
    rawRecords: [],          // 原始记录
    byStudent: new Map(),    // studentId -> 该学生的所有提交记录[]
    csvLoaded: false,        // 是否已经加载完 CSV
    pendingStudentId: null,   // 如果雷达图先更新，这里先记住 studentId，等 CSV 好了再画
    globalCalendarStart: null,
    globalCalendarEnd: null
  };

  /**
   * 把 CSV 的一行，转成 JS 对象
   * 表头：序号-班级-学生ID-题目编号-提交时间(年月日)-提交时间(时分秒)
   */
  function parseSubmitRow(row) {
    // 注意这里用中文列名，你的 CSV 表头必须对应
    const clazz      = (row['班级'] || '').trim();
    const studentId  = (row['学生ID'] || '').trim();
    const questionId = (row['题目编号'] || '').trim();
    const dateStr    = (row['提交时间(年月日)'] || '').trim();    // 例如 2024/1/2
    const timeStr    = (row['提交时间(时分秒)'] || '').trim() || '00:00:00'; // 例如 23:37:52

    if (!studentId || !dateStr) return null;

    // 解析日期
    const [y, m, d] = dateStr.split(/[\/\-]/).map(Number);
    const [hh = 0, mm = 0, ss = 0] = timeStr.split(':').map(Number);

    const date = new Date(y, m - 1, d);                       // 只含日期（给日历用）
    const dateTime = new Date(y, m - 1, d, hh, mm, ss);       // 含时间（给小时用）

    return {
      clazz,
      studentId,
      questionId,
      date,
      dateTime
    };
  }

  /**
   * 按“小时 + 月序”聚合成极坐标数据
   * 返回：[{ hour, layer, count }]
   *  - hour  : 0~23
   *  - layer : 第几个月（从 0 开始），用来控制往外排第几圈
   *  - count : 该小时在该圈的提交次数
   */
  function buildHourlyData(records) {
    if (!records.length) return [];

    // 以最早日期为 0 月
    const minMonth = d3.timeMonth.floor(d3.min(records, d => d.dateTime));

    const map = new Map(); // key: `${layer}-${hour}` -> count

    records.forEach(r => {
      const hour = r.dateTime.getHours();
      const layer = d3.timeMonth.count(minMonth, r.dateTime); // 0,1,2,...

      const key = `${layer}-${hour}`;
      map.set(key, (map.get(key) || 0) + 1);
    });

    const result = [];
    for (const [key, count] of map.entries()) {
      const [layerStr, hourStr] = key.split('-');
      result.push({
        hour: +hourStr,
        layer: +layerStr,
        count
      });
    }
    return result;
  }

  /**
   * 构造日历图数据
   * 返回：[{ date: Date, count }]
   *  - 覆盖该学生有记录的最早-最晚日期，每天都给一个格子
   */
  function buildCalendarData(records) {
  // 没有全局范围就先不画
  if (!SubmitProfileState.globalCalendarStart || !SubmitProfileState.globalCalendarEnd) {
    return [];
  }

  const start = SubmitProfileState.globalCalendarStart;
  const end   = SubmitProfileState.globalCalendarEnd;

  // 仍然只统计“这个学生”的每天次数
  const dateCount = d3.rollup(
    records,
    v => v.length,
    r => +d3.timeDay.floor(r.date)
  );

  // 但生成格子的时候，用“全局起止日期”
  const days = d3.timeDay.range(start, d3.timeDay.offset(end, 1));

  return days.map(d => ({
    date: d,
    count: dateCount.get(+d) || 0   // 没做题的日子 count = 0
  }));
}

  /**
   * 真正负责“加载 CSV + 根据 studentId 画图”的模块
   * 挂到 window，方便 main.js 调用
   */
  window.StudentProfile = {
    // 初始化：只做一次，加载 submit_records.csv
    init() {
      const csvPath = './data/submit_records.csv'; // 对应 C:\...\ChinaVis\assets\submit_records.csv

      d3.csv(csvPath, parseSubmitRow)
        .then(rows => {
          const validRows = rows.filter(r => r); // 去掉 parse 返回 null 的行

          SubmitProfileState.rawRecords = validRows;
          SubmitProfileState.byStudent = d3.group(validRows, d => d.studentId);
          SubmitProfileState.csvLoaded = true;


          // ⭐ 新增：全局日历范围
          SubmitProfileState.globalCalendarStart = d3.timeDay.floor(
            d3.min(validRows, d => d.date)
          );
          SubmitProfileState.globalCalendarEnd = d3.timeDay.floor(
            d3.max(validRows, d => d.date)
          );


          console.log('[StudentProfile] CSV 加载完成，共', validRows.length, '条记录');

          // 如果雷达图已经把某个 studentId 传进来了，这里补一次更新
          if (SubmitProfileState.pendingStudentId) {
            this.updateFromStudentId(SubmitProfileState.pendingStudentId);
            SubmitProfileState.pendingStudentId = null;
          }
        })
        .catch(err => {
          console.error('[StudentProfile] 读取 submit_records.csv 失败：', err);
        });
    },

    /**
     * main.js 每次选中学生后调用：刷新上面极坐标 + 下面日历
     */
    updateFromStudentId(studentId) {
      if (!studentId) {
        this.clear();
        return;
      }

      if (!SubmitProfileState.csvLoaded) {
        // CSV 还没好，先记住，等 init() 完成再用
        SubmitProfileState.pendingStudentId = studentId;
        return;
      }

      const records = SubmitProfileState.byStudent.get(studentId) || [];

      // 计算两个图的数据
      const hourlyData   = buildHourlyData(records);
      const calendarData = buildCalendarData(records);

      // 先清空旧的，再重画
      // 这里的选择器要跟你 HTML 里 <svg id="..."> 的 id 对应
      d3.select('#zyz_2_hourly-svg').selectAll('*').remove();
      d3.select('#zyz_2_calendar-svg').selectAll('*').remove();

      drawHourlyRadial('#zyz_2_hourly-svg', hourlyData);
      drawCalendar('#zyz_2_calendar-svg', calendarData);
    },

    // 清空学生画像相关图表
    clear() {
      d3.select('#zyz_2_hourly-svg').selectAll('*').remove();
      d3.select('#zyz_2_calendar-svg').selectAll('*').remove();
      SubmitProfileState.pendingStudentId = null;
    }
  };

  // 页面加载完就去加载 CSV（不用管当前学生是谁）
  window.addEventListener('DOMContentLoaded', () => {
    if (window.StudentProfile) {
      window.StudentProfile.init();
    }
  });

  // ======= 下面继续保留你原来的 tooltip / drawHourlyRadial / drawCalendar 等代码 =======



  
  // =============== 公共：tooltip ===============
  const tooltip = d3.select('#zyz_2_viz-tooltip');

  function showTooltip(html, event) {
    tooltip
      .style('opacity', 1)
      .html(html);

    // event.clientX/Y 更贴近鼠标位置
    tooltip
      .style('left', `${event.clientX}px`)
      .style('top', `${event.clientY - 12}px`);
  }

  function moveTooltip(event) {
    tooltip
      .style('left', `${event.clientX}px`)
      .style('top', `${event.clientY - 12}px`);
  }

  function hideTooltip() {
    tooltip.style('opacity', 0);
  }

  
  // =============== 上方：极坐标图 ===============

  // =============== 上方：极坐标图 (v3：移除所有悬停视觉特效，防数据失真) ===============

  function drawHourlyRadial(selector, data) {
    const svg = d3.select(selector);
    svg.selectAll('*').remove();

    const width = 320;
    const height = 280;
    const margin = 45;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    svg.append('text')
      .attr('x', width / 2)          // 水平居中
      .attr('y', 20)                 // 距离顶部 20px
      .attr('text-anchor', 'middle') // 文本锚点设为中间
      .attr('fill', '#ffffff')       // 字体颜色（白色，可改为 #e2e8f0 等）
      .attr('font-size', '16px')     // 字体大小
      .attr('font-weight', 'bold')   // 字体加粗
      .style('pointer-events', 'none') // 防止鼠标遮挡交互
      .text('学习者答题时间分布');    // 标题内容

    const cx = width / 2;
    const cy = height / 2 +15; 

    const g = svg.append('g')
      .attr('transform', `translate(${cx},${cy})`);

    const innerRadius = 20;
    const outerRadius = Math.min(width, cy * 2) / 2 - margin;

    // 0~24 小时映射到一圈
    const angle = d3.scaleLinear()
      .domain([0, 24])
      .range([-Math.PI / 2, 3 * Math.PI / 2]);

    const hours = d3.range(24);

    // 背景暗圈
    g.append('circle')
      .attr('r', outerRadius + 8)
      .attr('fill', '#1e293b');

    // 同心圆刻度
    const ringCount = 3;
    const ringScale = d3.scaleLinear()
      .domain([0, ringCount])
      .range([innerRadius + 6, outerRadius]);

    g.append('g')
      .selectAll('circle.ring')
      .data(d3.range(1, ringCount + 1))
      .join('circle')
      .attr('class', 'ring')
      .attr('r', d => ringScale(d))
      .attr('fill', 'none')
      .attr('stroke', '#1b2944')
      .attr('stroke-dasharray', '2,4')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.6);

    // 辐射线
    g.append('g')
      .selectAll('line')
      .data(hours)
      .join('line')
      .attr('x1', d => innerRadius * Math.cos(angle(d)))
      .attr('y1', d => innerRadius * Math.sin(angle(d)))
      .attr('x2', d => (outerRadius + 2) * Math.cos(angle(d)))
      .attr('y2', d => (outerRadius + 2) * Math.sin(angle(d)))
      .attr('stroke', '#323948ff')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    // 中心光晕
    const defs = svg.append('defs');
    const gradient = defs.append('radialGradient')
      .attr('id', 'zyz_2_center-glow')
      .attr('cx', '50%')
      .attr('cy', '50%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#e2e8f0').attr('stop-opacity',  0.8);
    gradient.append('stop').attr('offset', '20%').attr('stop-color', '#e0f2fe').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#020617').attr('stop-opacity', 0);

    g.append('circle')
      .attr('r', innerRadius + 1)
      .attr('fill', 'url(#zyz_2_center-glow)');

    g.append('circle')
      .attr('r', innerRadius / 2000)
      .attr('fill', '#cbd5f5')
      .attr('fill-opacity', 100 / 255);

    // 小时刻度文本
    g.append('g')
      .selectAll('text')
      .data(hours)
      .join('text')
      .attr('x', d => (outerRadius + 12) * Math.cos(angle(d)))
      .attr('y', d => (outerRadius + 12) * Math.sin(angle(d)))
      .attr('dy', '0.32em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#a5b4fc')
      .attr('font-size', 9)
      .attr('pointer-events', 'none')
      .text(d => d);

    // 数据绘制准备
    const maxLayer = d3.max(data, d => d.layer) || 1;
    const rScale = d3.scaleLinear()
      .domain([0, maxLayer + 1])
      .range([innerRadius + 6, outerRadius - 3]);

    const sizeScale = d3.scaleSqrt()
      .domain(d3.extent(data, d => d.count))
      .range([0.5, 8]);

    const colorScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.count))
      .range(['#6ee7b7', '#22c55e']);

    // 数据点
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('class', 'radial-circle is-pointer')
      .attr('cx', d => rScale(d.layer) * Math.cos(angle(d.hour)))
      .attr('cy', d => rScale(d.layer) * Math.sin(angle(d.hour)))
      .attr('r', 0) // 初始为0，下面做入场动画
      .attr('fill', d => colorScale(d.count))
      .attr('fill-opacity', 0.9)
      .attr('stroke', '#064e3b')   // 固定的深绿色描边
      .attr('stroke-width', 0.6)   // 固定的描边宽度
      .style('filter', 'drop-shadow(0 0 6px rgba(45, 212, 191, 0.6))')
      
      // ================= 交互事件修改 =================
      .on('mouseenter', function (event, d) {
        // 1. 【已删除】所有改变样式（变大、变白边、变透明度）的代码全删
        //    保持视觉上的绝对静止，只出提示框

        // 2. 显示 Tooltip
        showTooltip(
          `<strong>${d.hour}:00 时段</strong><br/>提交次数：${d.count}`,
          event
        );
      })
      .on('mousemove', moveTooltip)
      .on('mouseleave', function () {
        // 1. 【已删除】恢复样式的代码全删
        hideTooltip();
      });

    // 初始入场动画 (保留，让图表出来时自然一点)
    nodes
      .transition()
      .delay((d, i) => 80 + i * 6)
      .duration(260)
      .ease(d3.easeCubicOut)
      .attr('r', d => sizeScale(d.count));
  }

  // =============== 下方：日历图 ===============
  /**
 * 修复版 v3：
 * 1. 自动适应日期
 * 2. 连续网格 + 黑色分割线
 * 3. 过滤掉 8月、2月 的【分割线】和【文字】
 */
function drawCalendar(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll('*').remove();

  const cellSize = 25;
  const paddingY = 25; 
  const paddingX = 4;

  // ============================================================
  // 1. 自动计算数据的时间范围
  // ============================================================
  let rangeStart, rangeEnd;
  if (data && data.length > 0) {
    rangeStart = d3.min(data, d => d.date);
    rangeEnd   = d3.max(data, d => d.date);
  } else {
    const now = new Date();
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const gridStart = d3.timeWeek.floor(rangeStart);
  const gridEnd   = d3.timeWeek.ceil(rangeEnd);
  const width = d3.timeWeek.count(gridStart, gridEnd) * cellSize + paddingX * 2;
  const height = 7 * cellSize + paddingY + 10;

  svg.attr('viewBox', `0 0 ${width} ${height}`).style('overflow', 'visible');
  const g = svg.append('g').attr('transform', `translate(${paddingX}, ${paddingY})`);

  // 数据映射
  const dataMap = new Map();
  data.forEach(d => {
    const k = `${d.date.getFullYear()}-${d.date.getMonth() + 1}-${d.date.getDate()}`;
    const existing = dataMap.get(k);
    if (existing) existing.count += d.count;
    else dataMap.set(k, { count: d.count, rawDate: d.date });
  });

  const maxCount = d3.max(data, d => d.count) || 1;
  const sizeScale = d3.scaleSqrt().domain([0, maxCount]).range([0, (cellSize - 4) / 2]);
  const colorScale = d3.scaleLinear().domain([0, maxCount]).range(['#facc15', '#fefce8']);

  // ============================================================
  // 2. 画底层网格
  // ============================================================
  const allDays = d3.timeDay.range(gridStart, gridEnd);
  g.append('g')
    .selectAll('rect')
    .data(allDays)
    .join('rect')
    .attr('x', d => d3.timeWeek.count(gridStart, d) * cellSize)
    .attr('y', d => d.getDay() * cellSize)
    .attr('width', cellSize) 
    .attr('height', cellSize)
    .attr('fill', '#1f2937')
    .attr('stroke', '#374151')
    .attr('stroke-width', 1);

  // ============================================================
  // 3. 准备月份数据 (核心修改：统一过滤)
  // ============================================================
  // 找出在这个时间段内的所有月份，并直接过滤掉 8月 和 2月
  const monthsData = d3.timeMonth.range(d3.timeMonth.floor(rangeStart), d3.timeMonth.offset(rangeEnd, 1))
    .filter(d => {
      const m = d.getMonth() + 1; 
      // 返回 true 保留，false 删除。这里删除了 8月 和 2月
      return m !== 8 && m !== 2;
    });

  function getMonthPath(t0) {
    const t1 = d3.timeMonth.ceil(t0);
    const w0 = d3.timeWeek.count(gridStart, t0);
    const w1 = d3.timeWeek.count(gridStart, t1);
    const d0 = t0.getDay();
    const d1 = t1.getDay();
    return `M${(w0 + 1) * cellSize},${d0 * cellSize}` + 
           `H${w0 * cellSize}V${7 * cellSize}` + 
           `H${w1 * cellSize}V${d1 * cellSize}` + 
           `H${(w1 + 1) * cellSize}V${0}` + 
           `H${(w0 + 1) * cellSize}Z`;
  }

  // ============================================================
  // 4. 画月份分割线 & 文字 (使用同一份过滤后的 monthsData)
  // ============================================================
  
  // 画线
  g.append('g')
    .selectAll('path')
    .data(monthsData) // 使用过滤后的数据
    .join('path')
    .attr('d', getMonthPath)
    .attr('fill', 'none')
    .attr('stroke', '#888888')
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .style('pointer-events', 'none');

  // 画文字
  g.append('g')
    .selectAll('text')
    .data(monthsData) // 使用过滤后的数据，8月和2月的文字也不会生成了
    .join('text')
    .attr('x', d => d3.timeWeek.count(gridStart, d) * cellSize + cellSize * 2)
    .attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text(d => `${d.getMonth() + 1}月`);

  // ============================================================
  // 5. 画数据圆点
  // ============================================================
  const activeDays = allDays.map(d => {
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const rec = dataMap.get(k);
    return rec ? { date: d, count: rec.count } : null;
  }).filter(item => item !== null);

  const circles = g.append('g')
    .selectAll('circle')
    .data(activeDays)
    .join('circle')
    .attr('class', 'is-pointer')
    .attr('cx', d => d3.timeWeek.count(gridStart, d.date) * cellSize + cellSize / 2)
    .attr('cy', d => d.date.getDay() * cellSize + cellSize / 2)
    .attr('r', 0)
    .attr('fill', d => colorScale(d.count))
    .style('filter', 'drop-shadow(0 0 5px rgba(250, 204, 21, 0.8))');

  // 交互事件
  circles
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .transition().duration(100)
        .attr('r', sizeScale(d.count) + 3)
        .attr('fill', '#fef08a');
      
      const tooltipHtml = `<strong>${d.date.toLocaleDateString()}</strong><br>提交: ${d.count}`;
      if (typeof showTooltip === 'function') showTooltip(tooltipHtml, event);
      else if (window.showTooltip) window.showTooltip(tooltipHtml, event);
    })
    .on('mousemove', (e) => {
       if (typeof moveTooltip === 'function') moveTooltip(e);
       else if (window.moveTooltip) window.moveTooltip(e);
    })
    .on('mouseleave', function (event, d) {
      d3.select(this)
        .transition().duration(200)
        .attr('r', sizeScale(d.count))
        .attr('fill', colorScale(d.count));
      
      if (typeof hideTooltip === 'function') hideTooltip();
      else if (window.hideTooltip) window.hideTooltip();
    })
    .transition()
    .delay((d, i) => i * 5)
    .duration(300)
    .attr('r', d => sizeScale(d.count));
}



})();
