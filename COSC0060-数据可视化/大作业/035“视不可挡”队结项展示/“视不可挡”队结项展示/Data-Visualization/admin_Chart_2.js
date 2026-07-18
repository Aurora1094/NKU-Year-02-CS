(async function () {
  let indexData = null;
  const appId = "admin_chart_2";

  window.GLOBAL_FILTER_STATE = {
    kp: "ALL",
    sub: "ALL",
    qid: "ALL"
  };

  // ---------------- 创建 DOM ----------------
  function createDOM() {
    const app = document.getElementById(appId);
    const width = app.dataset.width || "100%";
    const margin = app.dataset.margin || "16px auto";

    const container = document.createElement("div");
    container.style.width = width;
    container.style.margin = margin;
    container.style.padding = "8px";
    container.style.borderRadius = "8px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    app.appendChild(container);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "8px";
    controls.style.flexWrap = "wrap";
    controls.style.justifyContent = "center";
    controls.style.marginBottom = "8px";
    controls.style.width = "100%"; // 让控制区域占满宽度
    container.appendChild(controls);

    // 设置选择器样式对象
    const selectStyle = {
      padding: "6px 12px",
      borderRadius: "4px",
      background: "#071029",
      color: "#cbd5e1",
      border: "1px solid rgba(255,255,255,0.2)",
      width: "100px", // 设置固定宽度
      fontSize: "14px",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box" // 确保padding和border包含在宽度内
    };

    const selectorNames = ["知识点", "子知识点", "题目编号"];
    selectorNames.forEach((name) => {
      const sel = document.createElement("select");
      sel.id = `class_selector_${name}`;
      
      // 应用样式
      Object.keys(selectStyle).forEach(key => {
        sel.style[key] = selectStyle[key];
      });
      
      // 添加悬停效果
      sel.addEventListener("mouseover", () => {
        sel.style.border = "1px solid rgba(34,211,238,0.8)";
      });
      sel.addEventListener("mouseout", () => {
        sel.style.border = "1px solid rgba(255,255,255,0.2)";
      });
      
      // 添加焦点效果
      sel.addEventListener("focus", () => {
        sel.style.border = "1px solid rgba(34,211,238,1)";
        sel.style.boxShadow = "0 0 0 2px rgba(34,211,238,0.3)";
      });
      sel.addEventListener("blur", () => {
        sel.style.border = "1px solid rgba(255,255,255,0.2)";
        sel.style.boxShadow = "none";
      });
      
      controls.appendChild(sel);
    });

    const chartWrap = document.createElement("div");
    chartWrap.style.width = "100%";
    chartWrap.style.position = "relative";
    chartWrap.style.paddingTop = "66.66%";
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "classChartSVG";
    svg.style.position = "absolute";
    svg.style.top = 0;
    svg.style.left = 0;
    svg.style.width = "180%";
    svg.style.height = "115%";
    svg.setAttribute("viewBox", "0 0 800 500");
    chartWrap.appendChild(svg);
    container.appendChild(chartWrap);

    const info = document.createElement("div");
    info.id = "classInfo";
    info.style.marginTop = "12px";
    info.style.color = "#fefefe";
    info.style.textAlign = "center";
    container.appendChild(info);
  }

  // ---------------- SVG 图表绘制 ----------------
  function drawChart(classData) {
    const svg = document.getElementById("classChartSVG");
    svg.innerHTML = "";

    if (classData.length === 0) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "400");
      text.setAttribute("y", "250");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#fefefe");
      text.setAttribute("font-size", "20");
      text.textContent = "";
      svg.appendChild(text);
      return;
    }

    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = 800 - padding.left - padding.right;
    const chartHeight = 500 - padding.top - padding.bottom;

    const avgValues = classData.map((c) => c.avg);
    const avgAll = avgValues.reduce((sum, v) => sum + v, 0) / avgValues.length;

    const barWidth = chartWidth / classData.length;

    // 绘制坐标轴
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Y轴
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding.left);
    yAxis.setAttribute("y1", padding.top);
    yAxis.setAttribute("x2", padding.left);
    yAxis.setAttribute("y2", padding.top + chartHeight);
    yAxis.setAttribute("stroke", "#cbd5e1");
    yAxis.setAttribute("stroke-width", "2");
    axisGroup.appendChild(yAxis);

    // X轴
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", padding.left);
    xAxis.setAttribute("y1", padding.top + chartHeight);
    xAxis.setAttribute("x2", padding.left + chartWidth);
    xAxis.setAttribute("y2", padding.top + chartHeight);
    xAxis.setAttribute("stroke", "#cbd5e1");
    xAxis.setAttribute("stroke-width", "2");
    axisGroup.appendChild(xAxis);

    // Y轴刻度和标签
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + chartHeight - (i / 10) * chartHeight;
      
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", padding.left - 5);
      tick.setAttribute("y1", y);
      tick.setAttribute("x2", padding.left);
      tick.setAttribute("y2", y);
      tick.setAttribute("stroke", "#cbd5e1");
      axisGroup.appendChild(tick);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", padding.left - 10);
      label.setAttribute("y", y + 5);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#cbd5e1");
      label.setAttribute("font-size", "12");
      label.textContent = (i / 10).toFixed(1);
      axisGroup.appendChild(label);

      // 网格线
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("x1", padding.left);
      gridLine.setAttribute("y1", y);
      gridLine.setAttribute("x2", padding.left + chartWidth);
      gridLine.setAttribute("y2", y);
      gridLine.setAttribute("stroke", "rgba(255,255,255,0.1)");
      gridLine.setAttribute("stroke-dasharray", "2,2");
      axisGroup.appendChild(gridLine);
    }

    svg.appendChild(axisGroup);

    // 绘制参考线
    const refLinesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");



    // 绘制柱状图
    const barsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    classData.forEach((item, i) => {
      const x = padding.left + i * barWidth + barWidth * 0.1;
      const barH = item.avg * chartHeight;
      const y = padding.top + chartHeight - barH;
      const w = barWidth * 0.8;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", w);
      rect.setAttribute("height", barH);
      rect.setAttribute("fill", "rgba(34,211,238,0.7)");
      rect.setAttribute("stroke", "rgba(34,211,238,1)");
      rect.setAttribute("stroke-width", "1");
      barsGroup.appendChild(rect);

      // X轴标签
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x + w / 2);
      label.setAttribute("y", padding.top + chartHeight + 20);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#cbd5e1");
      label.setAttribute("font-size", "12");
      label.textContent = item.className;
      barsGroup.appendChild(label);

      // 数值标签
      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      valueLabel.setAttribute("x", x + w / 2);
      valueLabel.setAttribute("y", y - 5);
      valueLabel.setAttribute("text-anchor", "middle");
      valueLabel.setAttribute("fill", "#fefefe");
      valueLabel.setAttribute("font-size", "15");
      valueLabel.textContent = item.avg.toFixed(3);
      barsGroup.appendChild(valueLabel);
    });

    svg.appendChild(barsGroup);
    // 整体平均线
    const avgY = padding.top + chartHeight - avgAll * chartHeight;
    const avgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    avgLine.setAttribute("x1", padding.left);
    avgLine.setAttribute("y1", avgY);
    avgLine.setAttribute("x2", padding.left + chartWidth);
    avgLine.setAttribute("y2", avgY);
    avgLine.setAttribute("stroke", "rgba(255,255,255,0.8)");
    avgLine.setAttribute("stroke-width", "2");
    avgLine.setAttribute("stroke-dasharray", "5,5");
    refLinesGroup.appendChild(avgLine);

    // 高掌握程度线 (0.8)
    const highY = padding.top + chartHeight - 0.8 * chartHeight;
    const highLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    highLine.setAttribute("x1", padding.left);
    highLine.setAttribute("y1", highY);
    highLine.setAttribute("x2", padding.left + chartWidth);
    highLine.setAttribute("y2", highY);
    highLine.setAttribute("stroke", "rgba(0,255,0,0.9)");
    highLine.setAttribute("stroke-width", "1.5");
    highLine.setAttribute("stroke-dasharray", "5,5");
    refLinesGroup.appendChild(highLine);

    // 低掌握程度线 (0.6)
    const lowY = padding.top + chartHeight - 0.6 * chartHeight;
    const lowLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lowLine.setAttribute("x1", padding.left);
    lowLine.setAttribute("y1", lowY);
    lowLine.setAttribute("x2", padding.left + chartWidth);
    lowLine.setAttribute("y2", lowY);
    lowLine.setAttribute("stroke", "rgba(255,0,0,0.9)");
    lowLine.setAttribute("stroke-width", "1.5");
    lowLine.setAttribute("stroke-dasharray", "5,5");
    refLinesGroup.appendChild(lowLine);

    svg.appendChild(refLinesGroup);
    // 图例
    const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const legends = [
      { text: `整体平均 (${avgAll.toFixed(3)})`, color: "rgba(255,255,255,0.8)", dash: true },
      { text: "高掌握程度 (0.8)", color: "rgba(0,255,0,0.9)", dash: true },
      { text: "低掌握程度 (0.6)", color: "rgba(255,0,0,0.9)", dash: true }
    ];

    legends.forEach((legend, i) => {
      const x = padding.left + i * 180;
      const y = 25;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", y);
      line.setAttribute("x2", x + 20);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", legend.color);
      line.setAttribute("stroke-width", "2");
      if (legend.dash) line.setAttribute("stroke-dasharray", "5,5");
      legendGroup.appendChild(line);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x + 25);
      text.setAttribute("y", y + 4);
      text.setAttribute("fill", "#cbd5e1");
      text.setAttribute("font-size", "21");
      text.textContent = legend.text;
      legendGroup.appendChild(text);
    });

    svg.appendChild(legendGroup);

    // Y轴标题
    const yTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yTitle.setAttribute("x", -250);
    yTitle.setAttribute("y", 20);
    yTitle.setAttribute("transform", "rotate(-90)");
    yTitle.setAttribute("text-anchor", "middle");
    yTitle.setAttribute("fill", "#cbd5e1");
    yTitle.setAttribute("font-size", "24");
    yTitle.textContent = "平均掌握程度";
    svg.appendChild(yTitle);

    svg.style.transform = "translateX(-120px)";
  }

  // ---------------- 加载知识点索引 ----------------
  async function loadIndex() {
    const res = await fetch("data/admin_index.json");
    indexData = await res.json();
  }

  // ---------------- 控制选择器禁用逻辑 ----------------
  function applySelectorLock() {
    const kpSel = document.getElementById("class_selector_知识点");
    const subSel = document.getElementById("class_selector_子知识点");
    const qidSel = document.getElementById("class_selector_题目编号");

    if (kpSel.value === "ALL") {
      subSel.value = "ALL";
      qidSel.value = "ALL";
      subSel.disabled = true;
      qidSel.disabled = true;
      return;
    }

    subSel.disabled = false;

    if (subSel.value === "ALL") {
      qidSel.value = "ALL";
      qidSel.disabled = true;
      return;
    }

    qidSel.disabled = false;
  }

  // ---------------- 填充选择器 ----------------
  function populateSelectors() {
    const kpSel = document.getElementById("class_selector_知识点");
    const subSel = document.getElementById("class_selector_子知识点");
    const qidSel = document.getElementById("class_selector_题目编号");

    kpSel.innerHTML = `<option value="ALL">全部</option>`;
    Object.keys(indexData).forEach((kp) => {
      kpSel.appendChild(new Option(kp, kp));
    });

    kpSel.addEventListener("change", () => {
      const kp = kpSel.value;
      subSel.innerHTML = `<option value="ALL">全部</option>`;
      qidSel.innerHTML = `<option value="ALL">全部</option>`;

      if (kp !== "ALL") {
        Object.keys(indexData[kp]).forEach((sub) => {
          subSel.appendChild(new Option(sub, sub));
        });
      }

      applySelectorLock();
      updateChart();
    });

    subSel.addEventListener("change", () => {
      const kp = kpSel.value;
      const sub = subSel.value;

      qidSel.innerHTML = `<option value="ALL">全部</option>`;

      if (kp !== "ALL" && sub !== "ALL") {
        Object.keys(indexData[kp][sub]).forEach((qid) => {
          qidSel.appendChild(new Option(qid, qid));
        });
      }

      applySelectorLock();
      updateChart();
    });

    qidSel.addEventListener("change", () => {
      applySelectorLock();
      updateChart();
    });
  }

  // ---------------- 加载班级数据 ----------------
  async function loadClassData(kp, subkp, qid) {
    const classFolder = "data/class_summary_data/";
    const classes = Array.from({ length: 15 }, (_, i) => `Class${i + 1}`);
    const output = [];

    for (const cls of classes) {
      let avg = 0;

      try {
        let summaryPath = `${classFolder}${cls}/summary.json`;

        if (kp !== "ALL" && subkp === "ALL") {
          summaryPath = `${classFolder}${cls}/${kp}/summary.json`;
        }

        if (kp !== "ALL" && subkp !== "ALL" && qid === "ALL") {
          summaryPath = `${classFolder}${cls}/${kp}/${subkp}/summary.json`;
        }

        const summaryRes = await fetch(summaryPath);
        if (summaryRes.ok) {
          const summary = await summaryRes.json();
          avg = summary.average_proficiency ?? 0;
        }

        if (kp !== "ALL" && subkp !== "ALL" && qid !== "ALL") {
          const realFile = qid.endsWith(".json") ? qid : `${qid}.json`;
          const detailPath = `${classFolder}${cls}/${kp}/${subkp}/${realFile}`;

          const detailRes = await fetch(detailPath);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            avg = detail.average_proficiency ?? avg;
          }
        }
      } catch (e) {
        console.error("读取班级数据出错", cls, e);
      }

      output.push({ className: cls, avg });
    }

    return output;
  }

  // ---------------- 更新图表 ----------------
  async function updateChart() {
    const kp = document.getElementById("class_selector_知识点").value;
    const sub = document.getElementById("class_selector_子知识点").value;
    const qid = document.getElementById("class_selector_题目编号").value;

    console.group("【调试】选择参数");
    console.log("知识点 =", kp);
    console.log("子知识点 =", sub);
    console.log("题目编号 =", qid);
    console.groupEnd();

    window.GLOBAL_FILTER_STATE = { kp, sub, qid };
    window.dispatchEvent(new CustomEvent("global-filter-change", {
      detail: { kp, sub, qid }
    }));

    const classData = await loadClassData(kp, sub, qid);

    console.group("【调试】loadClassData 返回内容");
    console.table(classData);
    console.groupEnd();

    if (classData.length === 0) {
      drawChart([]);
      document.getElementById("classInfo").innerText = "无数据";
      return;
    }

    drawChart(classData);

    const avgValues = classData.map((c) => c.avg);
    const avgAll = avgValues.reduce((sum, v) => sum + v, 0) / avgValues.length;
    document.addEventListener("DOMContentLoaded", async () => {
      createDOM();
      await loadIndex();
      populateSelectors();
      drawChart([]);
    });

  }

  // ---------------- 初始化流程 ----------------
  document.addEventListener("DOMContentLoaded", async () => {
    createDOM();
    await loadIndex();
    populateSelectors();
    drawChart([]);
  });
})();