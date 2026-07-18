const width = 400, height = 250;
const innerRadius = (height - 50) * 0.7,
      outerRadius = (height - 50) * 0.8;

function clearCharts() {
  d3.select("#sex-analyze").selectAll("*").remove();
  d3.select("#age-analyze").selectAll("*").remove();
  d3.select("#major-analyze").selectAll("*").remove();
}

d3.csv("./data/Integrated_Class_Data.csv").then(function (data){
  const selector = d3.select("#classSelector");
  if (selector.empty()) return; // 这一页没有下拉框就跳过

  selector.property("value", "");
  clearCharts();

  let userInteracted = false;

  selector.on("pointerdown.classProfile", () => { userInteracted = true; });
  selector.on("mousedown.classProfile",  () => { userInteracted = true; });
  selector.on("keydown.classProfile",    () => { userInteracted = true; }); // 可选

  selector.on("change.classProfile", function () {
    if (!userInteracted) return;

    const selected = this.value;
    if (!selected) { clearCharts(); return; }

    sex_analyze(data, selected);
    age_analyze(data, selected);
    major_analyze(data, selected);
  });
});
function sex_analyze(rawdata, selectedClass) {
    const svg = d3.select("#sex-analyze")
        .attr("viewBox", [-width / 2, -height + 50, width, height])
    svg.selectAll("*").remove();
    if (!selectedClass) return;
    const data = rawdata.filter(d => d.Class_ID === selectedClass);
    const counter = d3.rollup(data, g => g.length, d => d.sex);
    const sexList = [...counter].map(([sex, count]) => ({
        sex: sex, count: count
    })).sort((x, y) => x.sex.localeCompare(y.sex));
    const total = sexList.reduce((sum, d) => sum + d.count, 0);
    // console.log("sexList = ", sexList);
    // console.log("total = ", total);

    const pieProcessor = d3.pie()
        .value(d => d.count)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2)
        .padAngle(0.02)
        .sort(null);
    const arcProcessor = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
    const colorMap = {
        male: "#3B82F6",
        female: "#F472B6"
    }

    const centerText = svg.append("g")
        .attr("class", "center-text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0, -30)");

    svg.append("g")
        .attr("class", "chart")
        .selectAll("path")
        .data(pieProcessor(sexList))
        .enter().append("path")
        .attr("d", arcProcessor)
        .attr("fill", d => colorMap[d.data.sex])
        .on("mouseover", function (event, d) {
            svg.selectAll(".chart path")
                .attr("fill", "#888888");
            d3.select(this)
                .attr("fill", colorMap[d.data.sex]);

            svg.selectAll(".label text")
                .attr("fill", "#888888")
                .attr("font-size", "20px");
            svg.select(`.label text:nth-child(${Array.from(this.parentNode.childNodes).indexOf(this) + 1})`)
                .attr("fill", "white")
                .attr("font-weight", "bold")
                .attr("font-size", "28px");

            centerText.selectAll("*").remove();
            const percentage = ((d.data.count / total) * 100).toFixed(1);
            const textContent = centerText.append("text")
                .attr("fill", colorMap[d.data.sex])
                .attr("font-size", "48px")
                .attr("font-weight", "bold");
            textContent.append("tspan")
                .text(`${d.data.count}`);
            textContent.append("tspan")
                .attr("font-size", "32px")
                .text("人");
            textContent.append("tspan")
                .text(`/${percentage}`);
            textContent.append("tspan")
                .attr("font-size", "32px")
                .text("%");
        })
        .on("mouseout", function () {
            svg.selectAll(".chart path")
                .attr("fill", d => colorMap[d.data.sex]);
            svg.selectAll(".label text")
                .attr("fill", "white")
                .attr("font-size", "24px")
                .attr("font-weight", "normal");
            centerText.selectAll("*").remove();
        });

    svg.append("g")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(pieProcessor(sexList))
        .enter().append("text")
        .attr("transform", d => {
            const midAngle = (d.startAngle + d.endAngle) / 2;
            const labelRadius = outerRadius;
            const x = Math.sin(midAngle) * (outerRadius + 5);
            const y = -Math.cos(midAngle) * (outerRadius + 5);
            return `
                        translate(${x}, ${y})
                        rotate(${midAngle * 180 / Math.PI})
                    `;
        })
        .text(d => `${d.data.sex}`)
        .attr("fill", "white")
        .attr("font-size", "24px");
}

function age_analyze(rawdata, selectedClass) {
    const svg = d3.select("#age-analyze")
        .attr("viewBox", [-width / 2, -height + 50, width, height]);
    svg.selectAll("*").remove();
    if (!selectedClass) return;
    const data = rawdata.filter(d => d.Class_ID === selectedClass);
    const counter = d3.rollup(data, g => g.length, d => d.age);
    const ageList = [...counter].map(([age, count]) => ({
        age: age, count: count
    })).sort((x, y) => x.age - y.age);
    const total = ageList.reduce((sum, d) => sum + d.count, 0);
    // console.log("ageList = ", ageList);
    // console.log("total = ", total);

    const pieProcessor = d3.pie()
        .value(d => d.count)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2)
        .padAngle(0.02)
        .sort(null);
    const arcProcessor = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
    const colorMap = {
        "18": "#FF3B30",
        "19": "#FFDB4A",
        "20": "#8AFF80",
        "21": "#00FFCC",
        "22": "#007AFF",
        "23": "#FF498B",
        "24": "#AF52DE"
    };

    const centerText = svg.append("g")
        .attr("class", "center-text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0, -30)");

    svg.append("g")
        .attr("class", "chart")
        .selectAll("path")
        .data(pieProcessor(ageList))
        .enter().append("path")
        .attr("d", arcProcessor)
        .attr("fill", d => colorMap[d.data.age])
        .on("mouseover", function (event, d) {
            svg.selectAll(".chart path")
                .attr("fill", "#888888");
            d3.select(this)
                .attr("fill", colorMap[d.data.age]);

            svg.selectAll(".label text")
                .attr("fill", "#888888")
                .attr("font-size", "20px");
            svg.select(`.label text:nth-child(${Array.from(this.parentNode.childNodes).indexOf(this) + 1})`)
                .attr("fill", "white")
                .attr("font-weight", "bold")
                .attr("font-size", "28px");

            centerText.selectAll("*").remove();
            const percentage = ((d.data.count / total) * 100).toFixed(1);
            const textContent = centerText.append("text")
                .attr("fill", colorMap[d.data.age])
                .attr("font-size", "48px")
                .attr("font-weight", "bold");
            textContent.append("tspan")
                .text(`${d.data.count}`);
            textContent.append("tspan")
                .attr("font-size", "32px")
                .text("人");
            textContent.append("tspan")
                .text(`/${percentage}`);
            textContent.append("tspan")
                .attr("font-size", "32px")
                .text("%");
        })
        .on("mouseout", function () {
            svg.selectAll(".chart path")
                .attr("fill", d => colorMap[d.data.age]);
            svg.selectAll(".label text")
                .attr("fill", "white")
                .attr("font-size", "24px")
                .attr("font-weight", "normal");
            centerText.selectAll("*").remove();
        });

    svg.append("g")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(pieProcessor(ageList))
        .enter().append("text")
        .attr("transform", d => {
            const midAngle = (d.startAngle + d.endAngle) / 2;
            const labelRadius = outerRadius;
            const x = Math.sin(midAngle) * (outerRadius + 5);
            const y = -Math.cos(midAngle) * (outerRadius + 5);
            return `
                        translate(${x}, ${y})
                        rotate(${midAngle * 180 / Math.PI})
                    `;
        })
        .text(d => `${d.data.age}`)
        .attr("fill", "white")
        .attr("font-size", "24px");
}

function major_analyze(rawdata, selectedClass) {
    const svg = d3.select("#major-analyze")
        .attr("viewBox", [-width / 2, -height + 50, width, height]);
    svg.selectAll("*").remove();
    if (!selectedClass) return;
    const data = rawdata.filter(d => d.Class_ID === selectedClass);
    const counter = d3.rollup(data, g => g.length, d => d.major);
    const majorList = [...counter].map(([major, count]) => ({
        major: major, count: count
    })).sort((x, y) => x.major.localeCompare(y.major));
    const total = majorList.reduce((sum, d) => sum + d.count, 0);
    // console.log("majorList = ", majorList);
    // console.log("total = ", total);

    const pieProcessor = d3.pie()
        .value(d => d.count)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2)
        .padAngle(0.02)
        .sort(null);
    const arcProcessor = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
    const colorMap = {
        "J23517": "#FF3B30",
        "J40192": "#FFDB4A",
        "J57489": "#00FFCC",
        "J78901": "#007AFF",
        "J87654": "#AF52DE"
    };

    const centerText = svg.append("g")
        .attr("class", "center-text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0, -30)");

    svg.append("g")
        .attr("class", "chart")
        .selectAll("path")
        .data(pieProcessor(majorList))
        .enter().append("path")
        .attr("d", arcProcessor)
        .attr("fill", d => colorMap[d.data.major])
        .on("mouseover", function (event, d) {
            svg.selectAll(".chart path")
                .attr("fill", "#888888");
            d3.select(this)
                .attr("fill", colorMap[d.data.major]);

            svg.selectAll(".label text")
                .attr("fill", "#888888")
                .attr("font-size", "20px");
            svg.select(`.label text:nth-child(${Array.from(this.parentNode.childNodes).indexOf(this) + 1})`)
                .attr("fill", "white")
                .attr("font-weight", "bold")
                .attr("font-size", "28px");

            centerText.selectAll("*").remove();
            const percentmajor = ((d.data.count / total) * 100).toFixed(1);
            const textContent = centerText.append("text")
                .attr("fill", colorMap[d.data.major])
                .attr("font-size", "48px")
                .attr("font-weight", "bold");
            textContent.append("tspan")
                .text(`${d.data.count}`);
            textContent.append("tspan")
                .attr("font-size", "32px")
                .text("人");
            textContent.append("tspan")
                .text(`/${percentmajor}`);
            textContent.append("tspan")
                .attr("font-size", "32px")
                .text("%");
        })
        .on("mouseout", function () {
            svg.selectAll(".chart path")
                .attr("fill", d => colorMap[d.data.major]);
            svg.selectAll(".label text")
                .attr("fill", "white")
                .attr("font-size", "24px")
                .attr("font-weight", "normal");
            centerText.selectAll("*").remove();
        });

    svg.append("g")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(pieProcessor(majorList))
        .enter().append("text")
        .attr("transform", d => {
            const midAngle = (d.startAngle + d.endAngle) / 2;
            const labelRadius = outerRadius;
            const x = Math.sin(midAngle) * (outerRadius + 5);
            const y = -Math.cos(midAngle) * (outerRadius + 5);
            return `
                        translate(${x}, ${y})
                        rotate(${midAngle * 180 / Math.PI})
                    `;
        })
        .text(d => `${d.data.major}`)
        .attr("fill", "white")
        .attr("font-size", "24px");
}
