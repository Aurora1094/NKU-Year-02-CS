(async function () {
  const UI_CONFIG = {
    svgWidth: 800,
    svgHeight: 800
  };

  let indexData = null;
  let proficiencyData = null;

  // ===== 新增：注入防御性样式 =====
  function injectProtectiveStyles() {
    const styleId = 'scatter-chart-protective-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 防止选择框抖动 */
      #questionSelector {
        box-sizing: border-box !important;
        min-height: 40px !important;
        width: 100% !important;
      }
      
      /* 防止 SVG 容器抖动 */
      #admin_chart_1 {
        display: block !important;
        max-width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      /* 防止悬停时的布局变化 */
      #questionSelector:hover,
      #questionSelector:focus {
        outline-offset: 0 !important;
        transform: none !important;
      }
      
      /* 确保容器稳定 */
      .chart-container {
        position: relative !important;
        width: 100% !important;
        min-height: 800px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------- 初始化 SVG ----------------
  function initSVG() {
    const svg = d3.select("#admin_chart_1");
    svg.attr("viewBox", `0 0 ${UI_CONFIG.svgWidth} ${UI_CONFIG.svgHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("display", "block")  // 新增：防止 inline 导致的抖动
      .style("max-width", "100%")
      .style("height", "auto");

    // 标题
    svg.append("text")
      .attr("id", "chart-title")
      .attr("x", UI_CONFIG.svgWidth / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "40")
      .attr("font-weight", "bold")
      .text("学生掌握程度分布图");

    // 图表容器组
    svg.append("g")
      .attr("id", "scatterChartGroup")
      .attr("transform", "translate(0, 60)");
    
    
    // const svg = d3.select("#admin_chart_1");
    const infoGroup = svg.append("g")
      .attr("id", "infoGroup");

    // 添加信息文本
    infoGroup.append("text")
      .attr("id", "scatterInfo")
      .attr("x", UI_CONFIG.svgWidth / 2)
      .attr("y", UI_CONFIG.svgHeight - 60) // 在SVG底部上方留出空间
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "25");

    infoGroup.append("text")
      .attr("id", "difficultyInfo")
      .attr("x", UI_CONFIG.svgWidth / 2)
      .attr("y", UI_CONFIG.svgHeight - 25) // 在上方文本下方
      .attr("text-anchor", "middle")
      .attr("fill", "#fbbf24")
      .attr("font-size", "30")
      .attr("font-weight", "bold");

    // // 创建悬停信息容器（初始隐藏）
    // const tooltipGroup = svg.append("g")
    //   .attr("id", "tooltipGroup")
    //   .attr("opacity", 0)
    //   .attr("pointer-events", "none");

    // // 背景矩形
    // tooltipGroup.append("rect")
    //   .attr("id", "tooltipBg")
    //   .attr("fill", "rgba(15, 23, 42, 0.95)")
    //   .attr("stroke", "#ffffff")
    //   .attr("stroke-width", 1)
    //   .attr("rx", 6);

    // // 信息文本
    // tooltipGroup.append("text")
    //   .attr("id", "scatterInfo")
    //   .attr("fill", "#ffffff")
    //   .attr("font-size", "19");

    // // 难度信息文本
    // tooltipGroup.append("text")
    //   .attr("id", "difficultyInfo")
    //   .attr("fill", "#fbbf24")
    //   .attr("font-size", "19")
    //   .attr("font-weight", "bold");
  }

  // ---------------- SVG 散点图绘制 ----------------
  function drawScatterChart(scatterData, statistics) {
    const chartGroup = d3.select("#scatterChartGroup");
    chartGroup.selectAll("*").remove();

    if (scatterData.length === 0) {
      chartGroup.append("text")
        .attr("x", UI_CONFIG.svgWidth / 2)
        .attr("y", (UI_CONFIG.svgHeight - 120) / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "20")
        .text("");
      return;
    }

    const padding = { top: 80, right: 40, bottom: 100, left: 90 };
    const chartWidth = UI_CONFIG.svgWidth - padding.left - padding.right;
    const chartHeight = UI_CONFIG.svgHeight - 120 - padding.top - padding.bottom;

    // 绘制坐标轴
    const axisGroup = chartGroup.append("g");

    // Y轴
    axisGroup.append("line")
      .attr("x1", padding.left)
      .attr("y1", padding.top)
      .attr("x2", padding.left)
      .attr("y2", padding.top + chartHeight)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // X轴
    axisGroup.append("line")
      .attr("x1", padding.left)
      .attr("y1", padding.top + chartHeight)
      .attr("x2", padding.left + chartWidth)
      .attr("y2", padding.top + chartHeight)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    // Y轴刻度和标签
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + chartHeight - (i / 10) * chartHeight;

      // 刻度线
      axisGroup.append("line")
        .attr("x1", padding.left - 5)
        .attr("y1", y)
        .attr("x2", padding.left)
        .attr("y2", y)
        .attr("stroke", "#ffffff");

      // 标签
      axisGroup.append("text")
        .attr("x", padding.left - 10)
        .attr("y", y + 5)
        .attr("text-anchor", "end")
        .attr("fill", "#ffffff")
        .attr("font-size", "19")
        .text((i / 10).toFixed(1));

      // 网格线
      axisGroup.append("line")
        .attr("x1", padding.left)
        .attr("y1", y)
        .attr("x2", padding.left + chartWidth)
        .attr("y2", y)
        .attr("stroke", "rgba(255,255,255,0.1)")
        .attr("stroke-dasharray", "2,2");
    }

    // X轴刻度和标签
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (i / 10) * chartWidth;

      // 刻度线
      axisGroup.append("line")
        .attr("x1", x)
        .attr("y1", padding.top + chartHeight)
        .attr("x2", x)
        .attr("y2", padding.top + chartHeight + 5)
        .attr("stroke", "#ffffff");

      // 标签
      axisGroup.append("text")
        .attr("x", x)
        .attr("y", padding.top + chartHeight + 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "19")
        .text((i / 10).toFixed(1));

      // 网格线
      axisGroup.append("line")
        .attr("x1", x)
        .attr("y1", padding.top)
        .attr("x2", x)
        .attr("y2", padding.top + chartHeight)
        .attr("stroke", "rgba(255,255,255,0.1)")
        .attr("stroke-dasharray", "2,2");
    }

    // 绘制散点
    const pointsGroup = chartGroup.append("g");

    scatterData.forEach((point) => {
      const x = padding.left + point.avgAll * chartWidth;
      const y = padding.top + chartHeight - point.currentProf * chartHeight;

      const deviation = point.currentProf - point.avgAll;

      let fillColor, strokeColor, category;

      if (deviation >= 0.2) {
        fillColor = "rgba(34, 94, 197, 0.5)";
        strokeColor = "rgba(34, 94, 197, 0.8)";
        category = "远高于平均";
      } else if (deviation > 0) {
        fillColor = "rgba(134,239,172,0.5)";
        strokeColor = "rgba(134,239,172,0.8)";
        category = "略高于平均";
      } else if (deviation >= -0.2) {
        fillColor = "rgba(251,146,60,0.5)";
        strokeColor = "rgba(251,146,60,0.8)";
        category = "略低于平均";
      } else {
        fillColor = "rgba(239,68,68,0.5)";
        strokeColor = "rgba(239,68,68,0.8)";
        category = "远低于平均";
      }

      pointsGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 2.5)
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 0.5)
        .append("title")
        .text(`学生: ${point.studentId}\n班级: ${point.class}\n当前题目掌握程度: ${point.currentProf.toFixed(3)}\n整体平均掌握程度: ${point.avgAll.toFixed(3)}\n偏差: ${deviation >= 0 ? '+' : ''}${deviation.toFixed(3)}\n类别: ${category}`);
    });

    // 绘制参考线 y=x
    chartGroup.append("line")
      .attr("x1", padding.left)
      .attr("y1", padding.top + chartHeight)
      .attr("x2", padding.left + chartWidth)
      .attr("y2", padding.top)
      .attr("stroke", "rgba(255,255,0,0.8)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // 图例
    const legendGroup = chartGroup.append("g");
    const legends = [
      { text: "参考线 (y=x)", color: "rgba(255,255,0,0.8)", isLine: true },
      { text: `远高于平均: ${statistics.percentages.veryHigh}%`, color: "rgba(34, 94, 197, 0.5)", strokeColor: "rgba(34, 94, 197, 0.8)", isLine: false },
      { text: `略高于平均: ${statistics.percentages.high}%`, color: "rgba(134,239,172,0.5)", strokeColor: "rgba(134,239,172,0.8)", isLine: false },
      { text: `略低于平均: ${statistics.percentages.low}%`, color: "rgba(251,146,60,0.5)", strokeColor: "rgba(251,146,60,0.8)", isLine: false },
      { text: `远低于平均: ${statistics.percentages.veryLow}%`, color: "rgba(239,68,68,0.5)", strokeColor: "rgba(239,68,68,0.8)", isLine: false }
    ];

    legends.forEach((legend, i) => {
      const x = 60 + (i % 3) * 240;
      const y = 20 + Math.floor(i / 3) * 30;

      if (legend.isLine) {
        legendGroup.append("line")
          .attr("x1", x)
          .attr("y1", y-5)
          .attr("x2", x + 20)
          .attr("y2", y-5)
          .attr("stroke", legend.color)
          .attr("stroke-width", 4)
          .attr("stroke-dasharray", "5,5");
      } else {
        legendGroup.append("circle")
          .attr("cx", x + 10)
          .attr("cy", y-5)
          .attr("r", 10)
          .attr("fill", legend.color)
          .attr("stroke", legend.strokeColor)
          .attr("stroke-width", 1);
      }

      legendGroup.append("text")
        .attr("x", x + 25)
        .attr("y", y + 4)
        .attr("fill", "#ffffff")
        .attr("font-size", "25")
        .text(legend.text);
    });

    // 坐标轴标题
    chartGroup.append("text")
      .attr("x", -300)
      .attr("y", 40)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "25")
      .text("当前题目掌握程度");

    chartGroup.append("text")
      .attr("x", padding.left + chartWidth / 2)
      .attr("y", padding.top + chartHeight + 50)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "25")
      .text("整体平均掌握程度");

    // // 添加透明覆盖层用于悬停检测
    // chartGroup.append("rect")
    //   .attr("x", padding.left)
    //   .attr("y", padding.top)
    //   .attr("width", chartWidth)
    //   .attr("height", chartHeight)
    //   .attr("fill", "transparent")
    //   .attr("pointer-events", "all")
    //   .on("mouseenter", function () {
    //     d3.select("#tooltipGroup").attr("opacity", 1);
    //   })
    //   .on("mouseleave", function () {
    //     d3.select("#tooltipGroup").attr("opacity", 0);
    //   });
    const svg=d3.select("#admin_Chart_1")
    const infoGroup = svg.append("g")
      .attr("id", "infoGroup");

    // 添加信息文本
    infoGroup.append("text")
      .attr("id", "scatterInfo")
      .attr("x", UI_CONFIG.svgWidth / 2)
      .attr("y", padding.top + chartHeight + 100) // 在"整体平均掌握程度"下方150像素的位置
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "30");

    infoGroup.append("text")
      .attr("id", "difficultyInfo")
      .attr("x", UI_CONFIG.svgWidth / 2)
      .attr("y", padding.top + chartHeight + 125) // 在上方文本下方
      .attr("text-anchor", "middle")
      .attr("fill", "#fbbf24")
      .attr("font-size", "30")
      .attr("font-weight", "bold");
  }

  // ---------------- 加载知识点索引 ----------------
  async function loadIndex() {
    const res = await fetch("data/admin_index.json");
    indexData = await res.json();
  }

  // ---------------- 加载 CSV 数据 ----------------
  async function loadProficiencyData() {
    const res = await fetch("data/proficiency.csv");
    const text = await res.text();
    const lines = text.trim().split("\n");
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 7) {
        data.push({
          index: parts[0],
          class: parts[1],
          studentId: parts[2],
          kp: parts[3],
          subkp: parts[4],
          qid: parts[5],
          proficiency: parseFloat(parts[6])
        });
      }
    }

    proficiencyData = data;
  }

  // ---------------- 填充选择器 ----------------
  function populateSelectors() {
    const qidSel = d3.select("#questionSelector");

    // 收集所有题目编号
    const allQids = new Set();
    Object.keys(indexData).forEach((kp) => {
      Object.keys(indexData[kp]).forEach((sub) => {
        Object.keys(indexData[kp][sub]).forEach((qid) => {
          allQids.add(qid);
        });
      });
    });

    // 按题目编号排序并添加到选择器
    Array.from(allQids).sort().forEach((qid) => {
      qidSel.append("option").attr("value", qid).text(qid);
    });

    // ===== 修改：使用防抖处理 change 事件 =====
    let changeTimeout;
    // qidSel.on("change", function() {
    //   clearTimeout(changeTimeout);
    //   changeTimeout = setTimeout(() => {
    //     const selectedQid = d3.select(this).property("value");
    //     if (selectedQid) {
    //       updateChart();
    //     }
    //   }, 100); // 100ms 防抖延迟
    // });
    qidSel.on("change", function () {
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(() => {
        const selectedQid = d3.select(this).property("value");
        if (selectedQid) {
          updateChart();
        } else {
          // 当处于"未选中"状态时，清空图表界面
          drawScatterChart([], null);
          // d3.select("#tooltipGroup").attr("opacity", 0);
          d3.select("#scatterInfo").text("");
          d3.select("#difficultyInfo").text("");
        }
      }, 100); // 100ms 防抖延迟
    });
  }

  // ---------------- 准备散点图数据 ----------------
  function prepareScatterData(qid) {
    if (!proficiencyData || proficiencyData.length === 0) {
      return { scatterData: [], statistics: null };
    }

    let filteredData = proficiencyData.filter(d => d.proficiency > 0 && d.qid === qid);

    if (filteredData.length === 0) {
      return { scatterData: [], statistics: null };
    }

    const studentAvgMap = {};
    proficiencyData.filter(d => d.proficiency > 0).forEach(d => {
      if (!studentAvgMap[d.studentId]) {
        studentAvgMap[d.studentId] = { sum: 0, count: 0 };
      }
      studentAvgMap[d.studentId].sum += d.proficiency;
      studentAvgMap[d.studentId].count += 1;
    });

    let veryHighCount = 0;
    let highCount = 0;
    let lowCount = 0;
    let veryLowCount = 0;

    const scatterData = filteredData.map(d => {
      const avgAll = studentAvgMap[d.studentId].sum / studentAvgMap[d.studentId].count;
      const deviation = d.proficiency - avgAll;

      if (deviation >= 0.2) {
        veryHighCount++;
      } else if (deviation > 0) {
        highCount++;
      } else if (deviation >= -0.2) {
        lowCount++;
      } else {
        veryLowCount++;
      }

      return {
        studentId: d.studentId,
        class: d.class,
        currentProf: d.proficiency,
        avgAll: avgAll
      };
    });

    const total = scatterData.length;
    const percentages = {
      veryHigh: ((veryHighCount / total) * 100).toFixed(1),
      high: ((highCount / total) * 100).toFixed(1),
      low: ((lowCount / total) * 100).toFixed(1),
      veryLow: ((veryLowCount / total) * 100).toFixed(1)
    };

    const veryHighRatio = veryHighCount / total;
    const highRatio = highCount / total;
    const lowRatio = lowCount / total;
    const veryLowRatio = veryLowCount / total;

    const difficultyScore = 0.5 +
      veryHighRatio * (-0.5) +
      highRatio * (-0.1) +
      lowRatio * 0.1 +
      veryLowRatio * 0.5;

    const EASY_THRESHOLD = 0.4;
    const HARD_THRESHOLD = 0.6;

    let difficulty;
    if (difficultyScore < EASY_THRESHOLD) {
      difficulty = "简单";
    } else if (difficultyScore > HARD_THRESHOLD) {
      difficulty = "复杂";
    } else {
      difficulty = "正常";
    }

    return {
      scatterData,
      statistics: {
        percentages,
        difficultyScore,
        difficulty
      }
    };
  }

  // ---------------- 更新图表 ----------------
  async function updateChart() {
    const qid = d3.select("#questionSelector").property("value");

    // console.group("【调试】选择参数");
    // console.log("题目编号 =", qid);
    // console.groupEnd();

    const result = prepareScatterData(qid);
    const { scatterData, statistics } = result;

    // console.group("【调试】prepareScatterData 返回内容");
    // console.table(scatterData);
    // console.log("统计信息:", statistics);
    // console.groupEnd();

    if (scatterData.length === 0) {
      drawScatterChart([], null);
      // d3.select("#tooltipGroup").attr("opacity", 0);
      d3.select("#scatterInfo").text("");
      d3.select("#difficultyInfo").text("");
      return;
    }

    drawScatterChart(scatterData, statistics);

    const avgCurrentProf = scatterData.reduce((sum, d) => sum + d.currentProf, 0) / scatterData.length;
    const avgOverall = scatterData.reduce((sum, d) => sum + d.avgAll, 0) / scatterData.length;

    // 更新提示信息内容
    // const tooltipGroup = d3.select("#tooltipGroup");

    const infoText = `平均当前题目掌握程度: ${avgCurrentProf.toFixed(3)} | 平均整体掌握程度: ${avgOverall.toFixed(3)} | 难度系数: ${statistics.difficultyScore.toFixed(3)}`;
    const diffText = `该题目难度：${statistics.difficulty}`;

    // 更新文本
    // tooltipGroup.select("#scatterInfo")
    //   .attr("x", UI_CONFIG.svgWidth / 2)
    //   .attr("y", 665)
    //   .attr("text-anchor", "middle")
    //   .text(infoText);

    // tooltipGroup.select("#difficultyInfo")
    //   .attr("x", UI_CONFIG.svgWidth / 2)
    //   .attr("y", 688)
    //   .attr("text-anchor", "middle")
    //   .text(diffText);
    d3.select("#scatterInfo")
      .text(infoText);

    d3.select("#difficultyInfo")
      .text(diffText);

    // ===== 修改：使用 requestAnimationFrame 延迟计算 BBox =====
    // requestAnimationFrame(() => {
    //   const infoBBox = tooltipGroup.select("#scatterInfo").node().getBBox();
    //   const diffBBox = tooltipGroup.select("#difficultyInfo").node().getBBox();

    //   const bgWidth = Math.max(infoBBox.width, diffBBox.width) + 24;
    //   const bgHeight = infoBBox.height + diffBBox.height + 20;
    //   const bgX = UI_CONFIG.svgWidth / 2 - bgWidth / 2;
    //   const bgY = 650;

    //   tooltipGroup.select("#tooltipBg")
    //     .attr("x", bgX)
    //     .attr("y", bgY)
    //     .attr("width", bgWidth)
    //     .attr("height", bgHeight);
    // });
  }

  // ---------------- 初始化流程 ----------------
  async function init() {
    injectProtectiveStyles();  // ===== 新增：注入防御性样式 =====
    initSVG();
    await loadIndex();
    await loadProficiencyData();
    populateSelectors();
    drawScatterChart([], null);
  }

  // 等待 DOM 加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();