(async function() {
    const CONFIG = {
        xAxisMax: 40
    };

    let rawData = null;
    let indexData = null;

    const appId = "admin_chart_3";

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




        const chartWrap = document.createElement("div");
        chartWrap.style.width = "100%";
        chartWrap.style.position = "relative";
        chartWrap.style.paddingTop = "80%";
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "chart1";
        svg.style.position = "absolute";
        svg.style.top = 0;
        svg.style.left = 0;
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.setAttribute("viewBox", "0 0 400 300");
        svg.style.transform = "translateX(-40px)";
        chartWrap.appendChild(svg);
        container.appendChild(chartWrap);

        const info = document.createElement("div");
        info.id = "info";
        info.style.marginTop = "12px";
        info.style.color = "#fefefe";
        info.style.textAlign = "center";
        container.appendChild(info);
    }

    createDOM();


    async function loadIndex() {
        const res = await fetch("data/admin_index.json");
        indexData = await res.json();
    }

    async function loadData() {
        try {
            const response = await fetch("data/integrated_proficiency_with_score_rate.csv");
            const text = await response.text();
            rawData = parseCSV(text);
            console.log("数据加载成功:", rawData.length);
        } catch (e) {
            console.error("CSV 加载失败:", e);
        }
    }

    function cleanHeader(h) {
        return h.replace(/^\ufeff/, "").trim();
    }

    function parseCSV(text) {
        const lines = text.trim().split("\n");
        let headers = lines[0].split(",").map(cleanHeader);

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",");
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx] ? values[idx].trim() : "";
            });
            data.push(row);
        }
        return data;
    }

    function applySelectorLock() {
        const kpSel = selector知识点;
        const subSel = selector子知识点;
        const qidSel = selector题目编号;

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


    function filterData() {
        const { kp, sub, qid } = window.GLOBAL_FILTER_STATE;

        let filtered = rawData.filter(row => {
            const sr = parseFloat(row["得分率"]);
            const sb = parseFloat(row["提交次数"]);

            if (sr === -1 || sb === 0) return false;
            if (kp !== "ALL" && row["知识点"] !== kp) return false;
            if (sub !== "ALL" && row["子知识点"] !== sub) return false;
            if (qid !== "ALL" && row["题目编号"] !== qid) return false;

            return true;
        });

        return filtered.map(r => ({
            proficiency: parseFloat(r["掌握程度"]),
            scoreRate: parseFloat(r["得分率"]),
            submissions: parseInt(r["提交次数"]),
            student: r["学生ID"],
            title: r["题目编号"]
        }));
    }

    function drawScatterPlot(svgId, data, xField, xLabel, xMax) {
        const svg = document.getElementById(svgId);
        svg.innerHTML = "";

        const width = 390;
        const height = 300;

        const pad = { top: 0, right: 0, bottom: 20, left: 60 };
        const cw = width - pad.left - pad.right;
        const ch = height - pad.top - pad.bottom;

        // 过滤掉超出X轴最大值的数据点
        const filteredData = data.filter(p => p[xField] <= xMax);

        if (filteredData.length === 0) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", width / 2);
            text.setAttribute("y", height / 2);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#ccc");
            svg.appendChild(text);
            return;
        }

        const ggrid = document.createElementNS("http://www.w3.org/2000/svg", "g");
        for (let i = 0; i <= 10; i++) {
            const x = pad.left + (i / 10) * cw;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x);
            line.setAttribute("y1", pad.top);
            line.setAttribute("x2", x);
            line.setAttribute("y2", pad.top + ch);
            line.setAttribute("stroke", "rgba(255,255,255,0.05)");
            ggrid.appendChild(line);
        }
        for (let i = 0; i <= 10; i++) {
            const y = pad.top + ch - (i / 10) * ch;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", pad.left);
            line.setAttribute("y1", y);
            line.setAttribute("x2", pad.left + cw);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "rgba(255,255,255,0.05)");
            ggrid.appendChild(line);
        }
        svg.appendChild(ggrid);

        const gaxis = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", pad.left);
        yAxis.setAttribute("y1", pad.top);
        yAxis.setAttribute("x2", pad.left);
        yAxis.setAttribute("y2", pad.top + ch);
        yAxis.setAttribute("stroke", "#bbb");
        yAxis.setAttribute("stroke-width", "2");
        gaxis.appendChild(yAxis);

        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", pad.left);
        xAxis.setAttribute("y1", pad.top + ch);
        xAxis.setAttribute("x2", pad.left + cw);
        xAxis.setAttribute("y2", pad.top + ch);
        xAxis.setAttribute("stroke", "#bbb");
        xAxis.setAttribute("stroke-width", "2");
        gaxis.appendChild(xAxis);

        svg.appendChild(gaxis);

        for (let i = 0; i <= 10; i++) {
            const y = pad.top + ch - (i / 10) * ch;
            const lbl = (i / 10).toFixed(1);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", pad.left - 10);
            text.setAttribute("y", y + 4);
            text.setAttribute("text-anchor", "end");
            text.setAttribute("fill", "#aaa");
            text.textContent = lbl;
            svg.appendChild(text);
        }

        for (let i = 0; i <= 10; i++) {
            if (i === 0) continue;
            const x = pad.left + (i / 10) * cw;
            const lbl = (xMax * i / 10).toFixed(0);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", x);
            text.setAttribute("y", pad.top + ch + 20);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#aaa");
            text.textContent = lbl;
            svg.appendChild(text);
        }

        const xLabelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xLabelText.setAttribute("x", pad.left+20);
        xLabelText.setAttribute("y", height + 5);
        xLabelText.setAttribute("text-anchor", "end");
        xLabelText.setAttribute("fill", "#ccc");
        xLabelText.setAttribute("font-size", "16");
        xLabelText.textContent = xLabel;
        svg.appendChild(xLabelText);

        const yLabelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yLabelText.setAttribute("x", -(pad.top + ch / 2));
        yLabelText.setAttribute("y", 20);
        yLabelText.setAttribute("transform", "rotate(-90)");
        yLabelText.setAttribute("text-anchor", "middle");
        yLabelText.setAttribute("fill", "#ccc");
        yLabelText.setAttribute("font-size", "21");
        yLabelText.textContent = "掌握程度";
        svg.appendChild(yLabelText);

        const gpts = document.createElementNS("http://www.w3.org/2000/svg", "g");
        filteredData.forEach(p => {
            const cx = pad.left + (p[xField] / xMax) * cw;
            const cy = pad.top + ch - p.proficiency * ch;

            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", cx);
            c.setAttribute("cy", cy);
            c.setAttribute("r", 1.3);
            c.setAttribute("fill", "rgba(34,211,238,0.3)");
            c.setAttribute("stroke", "rgba(34,211,238,0.6)");
            c.setAttribute("stroke-width", 0.5);

            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `学生: ${p.student}\n题目: ${p.title}\n提交次数: ${p.submissions}\n掌握程度: ${p.proficiency.toFixed(3)}`;
            c.appendChild(title);

            gpts.appendChild(c);
        });
        svg.appendChild(gpts);
    }

    function updateCharts() {
        const xmax = CONFIG.xAxisMax;
        const data = filterData();

        if (data.length === 0) {
            drawScatterPlot("chart1", [], "submissions", "提交次数", xmax);
            document.getElementById("info").textContent = "无符合条件的数据";
            return;
        }

        drawScatterPlot("chart1", data, "submissions", "提交次数", xmax);

        const filteredData = data.filter(d => d.submissions <= xmax);
        const avgP = filteredData.length > 0 
            ? (filteredData.reduce((s, d) => s + d.proficiency, 0) / filteredData.length).toFixed(3)
            : "N/A";
        const avgC = filteredData.length > 0
            ? (filteredData.reduce((s, d) => s + d.submissions, 0) / filteredData.length).toFixed(2)
            : "N/A";

        document.getElementById("info").textContent =
            `平均掌握程度: ${avgP} | 平均提交次数: ${avgC}`;

        document.getElementById("info").style.visibility = "hidden"; 
    }

    async function init() {
        await loadIndex();
        await loadData();

        if (rawData && rawData.length > 0) {
            populateSelectors();
            updateCharts();
        }
    }
    window.addEventListener("global-filter-change", () => {
        updateCharts();
    });
    init();

})();