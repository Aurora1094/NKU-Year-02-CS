let allData = [];
let minTime, maxTime;
let minPos = 0;
let maxPos = 100;
let activeThumb = null;
let rangeDragStartX = 0;
let rangeDragStartMinPos = 0;
let rangeDragStartMaxPos = 0;

const minThumb = document.getElementById('wordcloud-minThumb');
const maxThumb = document.getElementById('wordcloud-maxThumb');
const sliderRange = document.getElementById('wordcloud-slider-range');
const timeDisplay = document.getElementById('wordcloud-timeDisplay');
const classSelector = document.getElementById('classSelector');

function fn_comp(a, b) {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}

d3.csv("./data/class_submit_knowledge_list.csv").then(function (data) {
    allData = data;
    const timestamps = data.map(d => +d.time);
    minTime = d3.min(timestamps);
    maxTime = d3.max(timestamps);
    
    // 从此开始注释
    // const classes = [...new Set(data.map(d => d.class))].sort(fn_comp);
    // classes.forEach(cls => {
    //     const option = document.createElement('option');
    //     option.value = cls;
    //     option.textContent = cls;
    //     classSelector.appendChild(option);
    // });
    // 从此结束注释

    minThumb.addEventListener('mousedown', startDrag);
    maxThumb.addEventListener('mousedown', startDrag);
    sliderRange.addEventListener('mousedown', startRangeDrag);
    // classSelector.addEventListener('change.wordcloud', updateWordCloud);
    d3.select("#classSelector").on("change.wordcloud", updateWordCloud);

    timeDisplay.innerHTML = `<strong>${formatTimestamp(minTime)}</strong> 至 <strong>${formatTimestamp(maxTime)}</strong>`;
    updateSlider();
    updateWordCloud();
});

d3.csv("./data/Data_TitleInfo.csv").then(function (data) {
    const knowledgeSet = new Set();
    const subKnowledgeSet = new Set();
    data.forEach(d => {
        knowledgeSet.add(d.knowledge);
        subKnowledgeSet.add(d.sub_knowledge);
    });
    subKnowledgeSet.forEach(subKnowledge => {
        if (subKnowledge && subKnowledge.includes('_')) {
            const parentKnowledgeName = subKnowledge.split('_')[0];
            const subKnowledgeName = subKnowledge.split('_')[1];
            if (knowledgeSet.has(parentKnowledgeName)) {
                if (!parentChildMap.has(parentKnowledgeName)) {
                    parentChildMap.set(parentKnowledgeName, new Set());
                }
                parentChildMap.get(parentKnowledgeName).add(subKnowledgeName);
                childParentMap.set(subKnowledgeName, parentKnowledgeName);
            }
        }
    });
    // console.log(parentChildMap);
    // console.log(childParentMap);
});





function updateSlider() {
    minThumb.style.left = minPos + '%';
    maxThumb.style.left = maxPos + '%';

    sliderRange.style.left = minPos + '%';
    sliderRange.style.width = (maxPos - minPos) + '%';

    const selectedMinTime = minTime + (maxTime - minTime) * (minPos / 100);
    const selectedMaxTime = minTime + (maxTime - minTime) * (maxPos / 100);

    timeDisplay.innerHTML = `<strong>${formatTimestamp(selectedMinTime)}</strong> 至 <strong>${formatTimestamp(selectedMaxTime)}</strong>`;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);

    const beijingTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));

    const year = beijingTime.getFullYear();
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getDate()).padStart(2, '0');

    const hours = String(beijingTime.getHours()).padStart(2, '0');
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
    const seconds = String(beijingTime.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function startDrag(e) {
    if (e.target !== minThumb && e.target !== maxThumb) return;
    activeThumb = e.target;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function startRangeDrag(e) {
    if (e.target !== sliderRange) return;

    rangeDragStartX = e.clientX;
    rangeDragStartMinPos = minPos;
    rangeDragStartMaxPos = maxPos;
    activeThumb = 'range';
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!activeThumb) return;

    const rect = document.querySelector('#wordcloud-slider-track').getBoundingClientRect();
    const deltaX = e.clientX - rangeDragStartX;
    const deltaPercent = (deltaX / rect.width) * 100;

    if (activeThumb === 'range') {
        let newMinPos = rangeDragStartMinPos + deltaPercent;
        let newMaxPos = rangeDragStartMaxPos + deltaPercent;

        if (newMinPos < 0) {
            const adjust = -newMinPos;
            newMinPos += adjust;
            newMaxPos += adjust;
        } else if (newMaxPos > 100) {
            const adjust = newMaxPos - 100;
            newMinPos -= adjust;
            newMaxPos -= adjust;
        }

        minPos = Math.max(0, Math.min(100, newMinPos));
        maxPos = Math.max(0, Math.min(100, newMaxPos));
    } else if (activeThumb === minThumb) {
        let pos = ((e.clientX - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        if (pos > maxPos) {
            minPos = maxPos;
            maxPos = pos;
            activeThumb = maxThumb;
        } else {
            minPos = pos;
        }
    } else if (activeThumb === maxThumb) {
        let pos = ((e.clientX - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        if (pos < minPos) {
            maxPos = minPos;
            minPos = pos;
            activeThumb = minThumb;
        } else {
            maxPos = pos;
        }
    }
    updateSlider();
    updateWordCloud();
}

function stopDrag() {
    activeThumb = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}
let parentChildMap = new Map();
let childParentMap = new Map();
let selectedMainKnowledge = null;
let selectedSubKnowledge = null;



let currentSelectedClass = "";
let proficiencyMap = {};
let subKnowledgeProficiencyMap = {};
function updateWordCloud() {
    const selectedClass = classSelector.value;
    if (currentSelectedClass !== selectedClass) {
        selectedMainKnowledge = null;
        selectedSubKnowledge = null;
        currentSelectedClass = selectedClass;
    }

    const selectedMinTime = minTime + (maxTime - minTime) * (minPos / 100);
    const selectedMaxTime = minTime + (maxTime - minTime) * (maxPos / 100);
    if (selectedClass === "") {
        renderWordCloud([], 0, 0);
        renderSubKnowledgeWordCloud([], 0, 0, {});
        return;
    }


    Promise.all([
        calculateClassProficiency(selectedClass),
        calculateSubKnowledgeProficiency(selectedClass)
    ]).then(function (results) {
        proficiencyMap = results[0];
        subKnowledgeProficiencyMap = results[1];

        let filteredData = allData.filter(d => {
            const time = +d.time;
            const inTimeRange = time >= selectedMinTime && time <= selectedMaxTime;
            const inClass = !selectedClass || d.class === selectedClass;
            return inTimeRange && inClass;
        });

        const knowledgeCount = {};
        filteredData.forEach(d => {
            const knowledge = d.knowledge;
            knowledgeCount[knowledge] = (knowledgeCount[knowledge] || 0) + 1;
        });
        const wordData = Object.entries(knowledgeCount)
            .map(([text, count]) => ({
                text,
                size: count
            }))
            .filter(d => d.size > 0);

        const subKnowledgeCount = {};
        filteredData.forEach(d => {
            const subKnowledge = d.subknowledge;
            subKnowledgeCount[subKnowledge] = (subKnowledgeCount[subKnowledge] || 0) + 1;
        });
        const subKnowledgeWordData = Object.entries(subKnowledgeCount)
            .map(([text, count]) => ({
                text,
                size: count
            }))
            .filter(d => d.size > 0);

        const globalKnowledgeCount = {};
        const globalSubKnowledgeCount = {};

        const classFilteredData = allData.filter(d => !selectedClass || d.class === selectedClass);
        classFilteredData.forEach(d => {
            const knowledge = d.knowledge;
            const subKnowledge = d.subknowledge;
            globalKnowledgeCount[knowledge] = (globalKnowledgeCount[knowledge] || 0) + 1;
            if (subKnowledge) {
                globalSubKnowledgeCount[subKnowledge] = (globalSubKnowledgeCount[subKnowledge] || 0) + 1;
            }
        });

        const globalSizes = Object.values(globalKnowledgeCount);
        const globalSubKnowledgeSizes = Object.values(globalSubKnowledgeCount);

        const globalMin = globalSizes.length > 0 ? d3.min(globalSizes) : 0;
        const globalMax = globalSizes.length > 0 ? d3.max(globalSizes) : 0;
        const globalSubMin = globalSubKnowledgeSizes.length > 0 ? d3.min(globalSubKnowledgeSizes) : 0;
        const globalSubMax = globalSubKnowledgeSizes.length > 0 ? d3.max(globalSubKnowledgeSizes) : 0;

        renderWordCloud(wordData, globalMin, globalMax);
        renderSubKnowledgeWordCloud(subKnowledgeWordData, globalMin, globalMax);
    });
}

function renderWordCloud(wordData, globalMin, globalMax) {
    const width = 500;
    const height = 400;
    const svg = d3.select("#wordcloud-knowledge")
        .attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const selectedClass = classSelector.value;
    if (selectedClass !== "") {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "32px")
            .attr("font-weight", "bold")
            .attr("fill", "#ffffff")
            .text(`${selectedClass} 知识点练习情况`);
    }

    if (wordData.length === 0) return;

    const sizes = wordData.map(d => d.size);
    const fontSizeScale = d3.scaleLinear()
        .domain([globalMin, globalMax])
        .range([15, 70]);

    d3.layout.cloud()
        .size([width, height - 50])
        .words(wordData)
        .padding(5)
        .rotate(() => 0)
        .fontSize(d => fontSizeScale(d.size))
        .on("end", draw)
        .random(() => 0.5)
        .start();

    function draw(words) {
        const wordcloud = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2 + 25})`);
        wordcloud.selectAll("text")
            .data(words)
            .enter().append("text")
            .attr("class", "word")
            .style("font-size", d => d.size + "px")
            .style("fill", d => {
                if (shouldDimMainKnowledge(d.text))
                    return "#888888";
                const proficiency = proficiencyMap[d.text];
                if (proficiency !== undefined)
                    return getProficiencyColor(proficiency);
            })
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
            .text(d => d.text)
            .on("click", function (event, d) {
                if (selectedMainKnowledge === d.text) {
                    selectedMainKnowledge = null;
                    selectedSubKnowledge = null;
                } else {
                    selectedMainKnowledge = d.text;
                    selectedSubKnowledge = null;
                }
                updateAllWordColors();
            });
    }
}

function renderSubKnowledgeWordCloud(wordData, globalMin, globalMax) {
    const width = 1000;
    const height = 400;
    const svg = d3.select("#wordcloud-subknowledge")
        .attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const selectedClass = classSelector.value;
    if (selectedClass !== "") {
        svg.append("text")
            .attr("x", (width - 200) / 2)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "32px")
            .attr("font-weight", "bold")
            .attr("fill", "#ffffff")
            .text(`${selectedClass} 子知识点练习情况`);


        const legendData = [
            { label: "优秀(80%-100%)", color: "#00D8A0", threshold: "80%-100%" },
            { label: "良好(70%-80%)", color: "#FCD34D", threshold: "70%-80%" },
            { label: "中等(60%-70%)", color: "#FB923C", threshold: "60%-70%" },
            { label: "较差(<60%)", color: "#EF4444", threshold: "<60%" },
            { label: "未选中", color: "#888888", threshold: "" }
        ];

        const legendGroup = svg.append("g")
            .attr("transform", `translate(${width - 200}, 70)`);

        const legendItems = legendGroup.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 30})`);

        legendItems.append("rect")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => d.color);

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 0)
            .attr("fill", "#ffffff")
            .attr("font-size", "20px")
            .attr("alignment-baseline", "middle")
            .text(d => d.label);
    }
    if (wordData.length === 0) return;

    const fontSizeScale = d3.scaleLinear()
        .domain([globalMin, globalMax])
        .range([15, 70]);

    d3.layout.cloud()
        .size([width - 200, height - 50])
        .words(wordData)
        .padding(5)
        .rotate(() => 0)
        .fontSize(d => fontSizeScale(d.size))
        .on("end", draw)
        .random(() => 0.5)
        .start();

    function draw(words) {
        const wordcloud = svg.append("g")
            .attr("transform", `translate(${(width - 200) / 2},${height / 2 + 25})`);
        wordcloud.selectAll("text")
            .data(words)
            .enter().append("text")
            .attr("class", "subknowledge-word")
            .style("font-size", d => d.size + "px")
            .style("fill", d => {
                if (shouldDimSubKnowledge(d.text))
                    return "#888888";
                const proficiency = subKnowledgeProficiencyMap[d.text];
                if (proficiency !== undefined)
                    return getProficiencyColor(proficiency);
            })
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
            .text(d => d.text)
            .on("click", function (event, d) {
                if (selectedSubKnowledge === d.text) {
                    selectedSubKnowledge = null;
                    selectedMainKnowledge = null;
                } else {
                    selectedSubKnowledge = d.text;
                    selectedMainKnowledge = childParentMap.get(d.text) || null;
                }
                updateAllWordColors();
            });
    }
}

function shouldDimMainKnowledge(knowledge) {
    if (!selectedMainKnowledge) return false;
    return knowledge !== selectedMainKnowledge;
}

function shouldDimSubKnowledge(subKnowledge) {
    if (!selectedMainKnowledge && !selectedSubKnowledge) return false;
    if (selectedSubKnowledge) return selectedSubKnowledge !== subKnowledge;
    return childParentMap.get(subKnowledge) !== selectedMainKnowledge;
}

function updateAllWordColors() {
    d3.select("#wordcloud-knowledge").selectAll("text.word")
        .style("fill", d => {
            if (shouldDimMainKnowledge(d.text))
                return "#888888";
            const proficiency = proficiencyMap[d.text];
            return getProficiencyColor(proficiency);
        });

    d3.select("#wordcloud-subknowledge").selectAll("text.subknowledge-word")
        .style("fill", d => {
            if (shouldDimSubKnowledge(d.text))
                return "#888888";
            const proficiency = subKnowledgeProficiencyMap[d.text];
            return getProficiencyColor(proficiency);
        });
}

function getProficiencyColor(proficiency) {
    if (proficiency >= 0.8 && proficiency <= 1.00) return "#00D8A0";
    else if (proficiency >= 0.7 && proficiency < 0.8) return "#FCD34D";
    else if (proficiency >= 0.6 && proficiency < 0.7) return "#FB923C";
    else return "#EF4444";
}

const proficiencyCache = new Map();
function calculateClassProficiency(selectedClass) {
    if (proficiencyCache.has(selectedClass)) {
        return Promise.resolve(proficiencyCache.get(selectedClass));
    }
    return d3.csv("./data/proficiency.csv").then(function (proficiencyData) {
        const classData = proficiencyData.filter(d => d.班级 === selectedClass);

        if (classData.length === 0) return {};

        const studentMap = new Map();
        const knowledgeSet = new Set();

        classData.forEach(row => {
            if (!studentMap.has(row.学生ID))
                studentMap.set(row.学生ID, []);
            studentMap.get(row.学生ID).push(row);
            knowledgeSet.add(row.知识点);
        });

        const students = Array.from(studentMap.keys());
        const studentCount = students.length;
        const knowledges = Array.from(knowledgeSet);
        const knowledgeProficiency = {};

        knowledges.forEach(knowledge => {
            let totalProficiency = 0;
            students.forEach(studentId => {
                const studentRecords = studentMap.get(studentId) || [];
                const knowledgeRecords = studentRecords.filter(record => record.知识点 === knowledge);

                if (knowledgeRecords.length === 0) {
                    totalProficiency += 0;
                    return;
                }

                const subKnowledgeMap = new Map();
                knowledgeRecords.forEach(record => {
                    if (!subKnowledgeMap.has(record.子知识点))
                        subKnowledgeMap.set(record.子知识点, []);
                    subKnowledgeMap.get(record.子知识点).push(record);
                });

                const subKnowledges = Array.from(subKnowledgeMap.keys());
                let subKnowledgeTotal = 0;

                subKnowledges.forEach(subKnowledge => {
                    const subKnowledgeRecords = subKnowledgeMap.get(subKnowledge);
                    const questionMap = new Map();

                    subKnowledgeRecords.forEach(record => {
                        if (!questionMap.has(record.题目编号)) {
                            questionMap.set(record.题目编号, []);
                        }
                        questionMap.get(record.题目编号).push(record);
                    });

                    const questions = Array.from(questionMap.keys());
                    let questionTotal = 0;

                    questions.forEach(question => {
                        const questionRecords = questionMap.get(question);
                        if (questionRecords.length > 0) {
                            questionTotal += parseFloat(questionRecords[0].掌握程度);
                        }
                    });

                    const subKnowledgeProficiency = questions.length > 0 ? questionTotal / questions.length : 0;
                    subKnowledgeTotal += subKnowledgeProficiency;
                });

                const studentKnowledgeProficiency = subKnowledges.length > 0 ? subKnowledgeTotal / subKnowledges.length : 0;
                totalProficiency += studentKnowledgeProficiency;
            });

            knowledgeProficiency[knowledge] = studentCount > 0 ? totalProficiency / studentCount : 0;
        });

        proficiencyCache.set(selectedClass, knowledgeProficiency);
        return knowledgeProficiency;
    });
}

let subKnowledgeProficiencyCache = new Map();
function calculateSubKnowledgeProficiency(selectedClass) {
    if (subKnowledgeProficiencyCache.has(selectedClass)) {
        return Promise.resolve(subKnowledgeProficiencyCache.get(selectedClass));
    }

    return d3.csv("./data/proficiency.csv").then(function (proficiencyData) {
        const classData = proficiencyData.filter(d => d.班级 === selectedClass);

        if (classData.length === 0) return {};

        const studentMap = new Map();
        const subKnowledgeSet = new Set();

        classData.forEach(row => {
            if (!studentMap.has(row.学生ID))
                studentMap.set(row.学生ID, []);
            studentMap.get(row.学生ID).push(row);
            subKnowledgeSet.add(row.子知识点);
        });

        const students = Array.from(studentMap.keys());
        const studentCount = students.length;
        const subKnowledges = Array.from(subKnowledgeSet);
        const subKnowledgeProficiency = {};

        subKnowledges.forEach(subKnowledge => {
            let totalProficiency = 0;
            let validStudents = 0;

            students.forEach(studentId => {
                const studentRecords = studentMap.get(studentId) || [];
                const subKnowledgeRecords = studentRecords.filter(record => record.子知识点 === subKnowledge);

                if (subKnowledgeRecords.length === 0) {
                    return;
                }

                const questionMap = new Map();
                subKnowledgeRecords.forEach(record => {
                    if (!questionMap.has(record.题目编号)) {
                        questionMap.set(record.题目编号, []);
                    }
                    questionMap.get(record.题目编号).push(record);
                });

                const questions = Array.from(questionMap.keys());
                let questionTotal = 0;

                questions.forEach(question => {
                    const questionRecords = questionMap.get(question);
                    if (questionRecords.length > 0) {
                        questionTotal += parseFloat(questionRecords[0].掌握程度);
                    }
                });

                const subKnowledgeProficiency = questions.length > 0 ? questionTotal / questions.length : 0;
                totalProficiency += subKnowledgeProficiency;
                validStudents++;
            });

            subKnowledgeProficiency[subKnowledge] = validStudents > 0 ? totalProficiency / validStudents : 0;
        });

        subKnowledgeProficiencyCache.set(selectedClass, subKnowledgeProficiency);
        return subKnowledgeProficiency;
    });
}
