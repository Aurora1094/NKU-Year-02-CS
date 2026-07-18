const margin = { top: 75, right: 125, bottom: 0, left: 120 };
const width = 750 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

const svg = d3.select("#class-ranking")
    .attr("viewBox", "0 0 750 1000")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
const yScale = d3.scaleBand().range([0, height]).padding(0.2);

const xAxis = d3.axisBottom(xScale).tickValues([0, 0.5, 1]);
const xAxisGroup = svg.append("g")
    .attr("id", "class-ranking-x-axis")
    .call(xAxis)
    .attr("font-size", "20px");

xAxisGroup.selectAll("text")
    .attr("font-size", "20px")
    .attr("dy", -15);
xAxisGroup.selectAll(".domain")
    .attr("stroke-width", "3");
xAxisGroup.selectAll(".tick line")
    .attr("stroke-width", "3")
    .attr("y2", 10);

svg.append("text")
    .attr("id", "class-ranking-x-label")
    .attr("y", 0)
    .attr("dy", "0.5em")
    .attr("x", width)
    .attr("dx", "0.5em")
    .attr("font-size", "24px")
    .style("fill", "white")
    .text("掌握程度");

svg.append("text")
    .attr("id", "class-ranking-title")
    .attr("y", 0)
    .attr("x", width / 2)
    .attr("dy", "-1em")
    .attr("font-size", "40px")
    .attr("font-weight", "bold")
    .style("fill", "white")
    .style("text-anchor", "middle")
    .text("各班级学生掌握程度分布箱线图");

const yAxisGroup = svg.append("g")
    .attr("id", "class-ranking-y-axis");

const tooltip = d3.select("body").append("div")
    .attr("id", "class-ranking-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#ffffff")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("z-index", "10")
    .style("display", "none");

function showTooltip(event, content) {
    tooltip.style("display", "block")
        .html(content)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

function moveTooltip(event) {
    tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
}

function hideTooltip() {
    tooltip.style("display", "none");
}

d3.csv("./data/proficiency.csv").then(function (data) {
    const studentQuestionMap = {};
    data.forEach(d => {
        const key = `${d.学生ID}-${d.题目编号}`;
        if (!studentQuestionMap[key]) {
            studentQuestionMap[key] = {
                studentId: d.学生ID,
                questionId: d.题目编号,
                proficiency: +d.掌握程度
            };
        }
    });

    const studentSubtopicQuestions = {};
    data.forEach(d => {
        const key = `${d.学生ID}-${d.子知识点}`;
        if (!studentSubtopicQuestions[key]) {
            studentSubtopicQuestions[key] = {
                studentId: d.学生ID,
                subtopicId: d.子知识点,
                topicId: d.知识点,
                questions: []
            };
        }

        const questionKey = `${d.学生ID}-${d.题目编号}`;
        const questionData = studentQuestionMap[questionKey];
        if (questionData && !studentSubtopicQuestions[key].questions.some(q => q.questionId === questionData.questionId)) {
            studentSubtopicQuestions[key].questions.push(questionData);
        }
    });

    const studentSubtopicProficiency = {};
    Object.values(studentSubtopicQuestions).forEach(subtopic => {
        const key = `${subtopic.studentId}-${subtopic.subtopicId}`;
        const proficiencies = subtopic.questions.map(q => q.proficiency);
        studentSubtopicProficiency[key] = {
            studentId: subtopic.studentId,
            subtopicId: subtopic.subtopicId,
            topicId: subtopic.topicId,
            proficiency: d3.mean(proficiencies)
        };
    });

    const studentTopicSubtopics = {};
    Object.values(studentSubtopicProficiency).forEach(subtopic => {
        const key = `${subtopic.studentId}-${subtopic.topicId}`;
        if (!studentTopicSubtopics[key]) {
            studentTopicSubtopics[key] = {
                studentId: subtopic.studentId,
                topicId: subtopic.topicId,
                subtopics: []
            };
        }
        studentTopicSubtopics[key].subtopics.push(subtopic);
    });

    const studentTopicProficiency = {};
    Object.values(studentTopicSubtopics).forEach(topic => {
        const key = `${topic.studentId}-${topic.topicId}`;
        const proficiencies = topic.subtopics.map(s => s.proficiency);
        studentTopicProficiency[key] = {
            studentId: topic.studentId,
            topicId: topic.topicId,
            proficiency: d3.mean(proficiencies)
        };
    });

    const studentOverallProficiency = {};
    Object.values(studentTopicProficiency).forEach(topic => {
        if (!studentOverallProficiency[topic.studentId]) {
            studentOverallProficiency[topic.studentId] = {
                studentId: topic.studentId,
                topics: []
            };
        }
        studentOverallProficiency[topic.studentId].topics.push(topic.proficiency);
    });

    const studentOverallProficiencyArray = [];
    Object.values(studentOverallProficiency).forEach(student => {
        studentOverallProficiencyArray.push({
            studentId: student.studentId,
            proficiency: d3.mean(student.topics)
        });
    });

    const classes = [...new Set(data.map(d => d.班级))]
        .sort((a, b) => {
            const numA = parseInt(a.replace("Class", ""));
            const numB = parseInt(b.replace("Class", ""));
            return numA - numB;
        });

    const classStudentMap = {};
    const studentClassMap = {};
    data.forEach(d => {
        if (!classStudentMap[d.班级]) {
            classStudentMap[d.班级] = new Set();
        }
        classStudentMap[d.班级].add(d.学生ID);
        studentClassMap[d.学生ID] = d.班级;
    });

    const classSelector = d3.select("#classSelector");
    // 从此开始注释
    // classes.forEach(cls => {
    //     classSelector.append("option")
    //         .attr("value", cls)
    //         .text(cls);
    // });
    // 从此结束注释

    function updateStudentSelector(selectedClass) {
        const studentSelector = d3.select("#studentSelector");
        studentSelector.selectAll("option:not(:first-child)").remove();

        if (selectedClass) {
            const students = Array.from(classStudentMap[selectedClass] || []).sort();
            const options = students.map(student =>
                `<option value="${student}">${student}</option>`
            ).join('');
            studentSelector.html('<option value="全部">全部</option>' + options);
        }
    }

    classSelector.on("change.class-ranking", function () {
        const selectedClass = this.value;
        // 从此开始注释
        // updateStudentSelector(selectedClass);
        // 从此结束注释
        drawBoxPlot(selectedClass, "");
    });

    d3.select("#studentSelector").on("change.class-ranking", function () {
        const selectedClass = classSelector.property("value");
        const selectedStudent = this.value;
        drawBoxPlot(selectedClass, selectedStudent);
    });

    function drawBoxPlot(selectedClass, selectedStudent) {
        const classData = classes.map(cls => ({
            className: cls,
            students: studentOverallProficiencyArray.filter(s =>
                (classStudentMap[cls] || new Set()).has(s.studentId))
        }));

        const boxPlotData = classData.map(cls => {
            const values = cls.students.map(s => s.proficiency).sort(d3.ascending);
            if (values.length === 0) return null;

            return {
                className: cls.className,
                min: d3.min(values),
                max: d3.max(values),
                median: d3.median(values),
                q1: d3.quantile(values, 0.25),
                q3: d3.quantile(values, 0.75),
                students: cls.students,
                values: values
            };
        }).filter(d => d !== null);

        yScale.domain(boxPlotData.map(d => d.className));

        boxPlotData.forEach(d => {
            const iqr = d.q3 - d.q1;
            const lowerBound = d.q1 - 1.5 * iqr;
            const upperBound = d.q3 + 1.5 * iqr;

            d.outliers = d.values.filter(v => v < lowerBound || v > upperBound);
            d.whiskerLow = d.values.filter(v => v >= lowerBound).sort(d3.ascending)[0];
            d.whiskerHigh = d.values.filter(v => v <= upperBound).sort(d3.descending)[0];
        });

        const yAxis = d3.axisLeft(yScale);
        yAxisGroup.call(yAxis)
            .attr("font-size", "20px");
        yAxisGroup.select(".domain")
            .attr("stroke-width", 3);
        yAxisGroup.selectAll(".tick line")
            .attr("stroke-width", "3")
            .attr("x2", -10);
        yAxisGroup.selectAll(".tick text")
            .attr("dx", -20);

        const boxGroups = svg.selectAll(".box-group")
            .data(boxPlotData, d => d.className);

        boxGroups.exit().remove();

        const newBoxGroups = boxGroups.enter()
            .append("g")
            .attr("class", "box-group")
            .attr("id", d => `class-ranking-${d.className}`);

        const allBoxGroups = newBoxGroups.merge(boxGroups);
        allBoxGroups.attr("transform", d => `translate(0,${yScale(d.className)})`);

        allBoxGroups.each(function (d) {
            const group = d3.select(this);

            let rect = group.select("rect.box");
            if (rect.empty()) {
                rect = group.append("rect").attr("class", "box");
            }
            rect.attr("id", `class-ranking-box-${d.className}`)
                .attr("x", xScale(d.q1))
                .attr("width", Math.max(1, xScale(d.q3) - xScale(d.q1)))
                .attr("y", 0)
                .attr("height", yScale.bandwidth())
                .attr("fill", "none")
                .attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF")
                .attr("stroke-width", 2);

            let medianLine = group.select("line.median");
            if (medianLine.empty()) {
                medianLine = group.append("line").attr("class", "median");
            }
            medianLine.attr("id", `class-ranking-median-${d.className}`)
                .attr("x1", xScale(d.median))
                .attr("x2", xScale(d.median))
                .attr("y1", 0)
                .attr("y2", yScale.bandwidth())
                .attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF")
                .attr("stroke-width", 5)
                .on("mouseover", function (event) {
                    showTooltip(event, `中位数：${d.median.toFixed(2)}`);
                    const elem = d3.select(this);
                    elem.attr("stroke", "#00FFCC");
                    const value = elem.attr("x1");
                    svg.append("line")
                        .attr("class", "reference-line")
                        .attr("x1", value)
                        .attr("x2", value)
                        .attr("y1", 0)
                        .attr("y2", height)
                        .attr("stroke", "#00FFCC")
                        .attr("stroke-dasharray", "5,5")
                        .attr("stroke-width", 3);
                })
                .on("mousemove", moveTooltip)
                .on("mouseout", function () {
                    hideTooltip();
                    const elem = d3.select(this);
                    elem.attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF");
                    svg.selectAll(".reference-line").remove();
                });

            // 更新四分位数线
            const quartiles = [
                { value: d.q1, type: "q1" },
                { value: d.q3, type: "q3" }
            ];

            const quartileLines = group.selectAll("line.quartile")
                .data(quartiles, d => d.type);

            quartileLines.enter()
                .append("line")
                .attr("class", "quartile")
                .merge(quartileLines)
                .attr("id", q => `class-ranking-quartile-${d.className}-${q.type}`)
                .attr("x1", q => xScale(q.value))
                .attr("x2", q => xScale(q.value))
                .attr("y1", 0)
                .attr("y2", yScale.bandwidth())
                .attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF")
                .attr("stroke-width", 5)
                .on("mouseover", function (event, q) {
                    showTooltip(event, q.type === "q1" ? `下四分位数：${q.value.toFixed(2)}` : `上四分位数：${q.value.toFixed(2)}`);
                    const elem = d3.select(this);
                    elem.attr("stroke", "#00FFCC");
                    const value = elem.attr("x1");
                    svg.append("line")
                        .attr("class", "reference-line")
                        .attr("x1", value)
                        .attr("x2", value)
                        .attr("y1", 0)
                        .attr("y2", height)
                        .attr("stroke", "#00FFCC")
                        .attr("stroke-dasharray", "5,5")
                        .attr("stroke-width", 4);
                })
                .on("mousemove", moveTooltip)
                .on("mouseout", function () {
                    hideTooltip();
                    const elem = d3.select(this);
                    elem.attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF");
                    svg.selectAll(".reference-line").remove();
                });

            quartileLines.exit().remove();

            const whiskers = [
                { low: d.whiskerLow, high: d.q1 },
                { low: d.q3, high: d.whiskerHigh }
            ];
            const whiskerLines = group.selectAll("line.whisker")
                .data(whiskers);
            whiskerLines.enter()
                .append("line")
                .attr("class", "whisker")
                .merge(whiskerLines)
                .attr("id", `class-ranking-whisker-${d.className}`)
                .attr("x1", w => xScale(w.low))
                .attr("x2", w => xScale(w.high))
                .attr("y1", yScale.bandwidth() / 2)
                .attr("y2", yScale.bandwidth() / 2)
                .attr("stroke", "#FFFFFF")
                .attr("stroke-dasharray", "4,4")
                .attr("stroke-width", 3);
            whiskerLines.exit().remove();


            const whiskerCaps = [
                { value: d.whiskerLow, type: "low" },
                { value: d.whiskerHigh, type: "high" }
            ];

            const capLines = group.selectAll("line.whisker-cap")
                .data(whiskerCaps);

            capLines.enter()
                .append("line")
                .attr("class", "whisker-cap")
                .merge(capLines)
                .attr("id", c => `class-ranking-whisker-cap-${d.className}-${c.type}`)
                .attr("x1", c => xScale(c.value))
                .attr("x2", c => xScale(c.value))
                .attr("y1", yScale.bandwidth() / 4)
                .attr("y2", yScale.bandwidth() * 3 / 4)
                .attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF")
                .attr("stroke-width", 5)
                .on("mouseover", function (event, c) {
                    showTooltip(event, `${c.type === 'low' ? '下极值' : '上极值'} ：${c.value.toFixed(2)}`);
                    const elem = d3.select(this);
                    elem.attr("stroke", "#00FFCC");
                    const value = elem.attr("x1");
                    svg.append("line")
                        .attr("class", "reference-line")
                        .attr("x1", value)
                        .attr("x2", value)
                        .attr("y1", 0)
                        .attr("y2", height)
                        .attr("stroke", "#00FFCC")
                        .attr("stroke-dasharray", "5,5")
                        .attr("stroke-width", 4);
                })
                .on("mousemove", moveTooltip)
                .on("mouseout", function () {
                    hideTooltip();
                    const elem = d3.select(this);
                    elem.attr("stroke", selectedClass && d.className === selectedClass ? "#F28E2B" : "#007AFF");
                    svg.selectAll(".reference-line").remove();
                });

            capLines.exit().remove();


            const outlierCircles = group.selectAll("circle.outlier")
                .data(d.outliers.map((o, i) => {
                    const student = d.students.find(s => s.proficiency === o);
                    const studentId = student ? student.studentId : `unknown-${i}`;
                    return {
                        value: o,
                        studentId: studentId,
                        className: d.className
                    };
                }), o => `${d.className}-${o.studentId}`);

            outlierCircles.enter()
                .append("circle")
                .attr("class", "outlier")
                .merge(outlierCircles)
                .attr("id", o => `class-ranking-outlier-${d.className}-${o.studentId}`)
                .attr("cx", o => xScale(o.value))
                .attr("cy", yScale.bandwidth() / 2)
                .attr("r", 5)
                .attr("fill", "#FF498B")
                .on("mouseover", function (event, o) {
                    showTooltip(event, `学生 ${o.studentId} <br> 掌握程度：${o.value.toFixed(2)}`);
                    const elem = d3.select(this);
                    elem.attr("fill", "#00FFCC")
                        .attr("stroke", "#00FFCC")
                        .attr("stroke-width", 5);
                    const value = elem.attr("cx");
                    svg.append("line")
                        .attr("class", "reference-line")
                        .attr("x1", value)
                        .attr("x2", value)
                        .attr("y1", 0)
                        .attr("y2", height)
                        .attr("stroke", "#00FFCC")
                        .attr("stroke-dasharray", "5,5")
                        .attr("stroke-width", 4);
                })
                .on("mousemove", moveTooltip)
                .on("mouseout", function () {
                    hideTooltip();
                    const elem = d3.select(this);
                    elem.attr("fill", "#FF498B")
                        .attr("stroke", null)
                        .attr("stroke-width", null);

                    svg.selectAll(".reference-line").remove();
                })
                .on("click", function (event, o) {
                    console.log(o.className, " ", o.studentId);

                    d3.select("#classSelector").property("value", o.className);

                    d3.select("#classSelector").dispatch("change");

                    setTimeout(() => {
                        d3.select("#studentSelector").property("value", o.studentId);
                        d3.select("#studentSelector").dispatch("change");
                    }, 10); 
                });

            outlierCircles.exit().remove();
        });


        svg.selectAll(".student-point").remove();
        svg.selectAll(".student-line").remove();


        if (selectedStudent && selectedStudent !== "全部") {
            const studentData = studentOverallProficiencyArray.find(s => s.studentId === selectedStudent);
            if (studentData) {
                const studentClass = studentClassMap[selectedStudent];
                if (studentClass) {
                    const classInfo = boxPlotData.find(d => d.className === studentClass);
                    if (classInfo) {
                        const isInBox = studentData.proficiency >= classInfo.q1 && studentData.proficiency <= classInfo.q3;
                        const isInWhiskerRange = studentData.proficiency >= classInfo.whiskerLow && studentData.proficiency <= classInfo.whiskerHigh;
                        const isOutlier = classInfo.outliers.includes(studentData.proficiency);

                        if (isInBox) {
                            const studentLine = svg.append("line")
                                .attr("class", "student-line")
                                .attr("id", "class-ranking-student-line")
                                .attr("x1", xScale(studentData.proficiency))
                                .attr("x2", xScale(studentData.proficiency))
                                .attr("y1", yScale(classInfo.className))
                                .attr("y2", yScale(classInfo.className) + yScale.bandwidth())
                                .attr("stroke", "#FF3B30")
                                .attr("stroke-width", 5)
                                .on("mouseover", function (event) {
                                    showTooltip(event, `学生 ${selectedStudent} <br> 掌握程度：${studentData.proficiency.toFixed(2)}`);
                                    const elem = d3.select(this);
                                    elem.attr("stroke", "#00FFCC")
                                        .attr("stroke-width", 5);

                                    const value = elem.attr("x1");
                                    svg.append("line")
                                        .attr("class", "reference-line")
                                        .attr("x1", value)
                                        .attr("x2", value)
                                        .attr("y1", 0)
                                        .attr("y2", height)
                                        .attr("stroke", "#00FFCC")
                                        .attr("stroke-dasharray", "5,5")
                                        .attr("stroke-width", 4);
                                })
                                .on("mousemove", moveTooltip)
                                .on("mouseout", function () {
                                    hideTooltip();
                                    const elem = d3.select(this);
                                    elem.attr("stroke", "#FF3B30")
                                        .attr("stroke-width", 5);
                                    svg.selectAll(".reference-line").remove();
                                });
                        } else if (isInWhiskerRange && !isOutlier) {
                            const studentPoint = svg.append("circle")
                                .attr("class", "student-point")
                                .attr("id", "class-ranking-student-point")
                                .attr("cx", xScale(studentData.proficiency))
                                .attr("cy", yScale(classInfo.className) + yScale.bandwidth() / 2)
                                .attr("r", 10)
                                .attr("fill", "#FF3B30")
                                .on("mouseover", function (event) {
                                    showTooltip(event, `学生 ${selectedStudent} <br> 掌握程度：${studentData.proficiency.toFixed(2)}`);
                                    const elem = d3.select(this);
                                    elem.attr("fill", "#00FFCC")
                                        .attr("stroke", "#00FFCC")
                                        .attr("stroke-width", 5);

                                    const value = elem.attr("cx");
                                    svg.append("line")
                                        .attr("class", "reference-line")
                                        .attr("x1", value)
                                        .attr("x2", value)
                                        .attr("y1", 0)
                                        .attr("y2", height)
                                        .attr("stroke", "#00FFCC")
                                        .attr("stroke-dasharray", "5,5")
                                        .attr("stroke-width", 4);
                                })
                                .on("mousemove", moveTooltip)
                                .on("mouseout", function () {
                                    hideTooltip();
                                    const elem = d3.select(this);
                                    elem.attr("fill", "#FF3B30")
                                        .attr("stroke", null)
                                        .attr("stroke-width", null);
                                    svg.selectAll(".reference-line").remove();
                                });
                        } else if (isOutlier) {
                            const outlierPoint = svg.select(`#class-ranking-outlier-${studentClass}-${selectedStudent}`);
                            if (!outlierPoint.empty()) {
                                const originalFill = outlierPoint.attr("fill");
                                outlierPoint
                                    .attr("r", 10)
                                    .attr("fill", "#FF3B30");

                                outlierPoint
                                    .on("mouseover", function (event) {
                                        showTooltip(event, `学生 ${selectedStudent} <br> 掌握程度：${studentData.proficiency.toFixed(2)}`);
                                        d3.select(this)
                                            .attr("fill", "#00FFCC")
                                            .attr("stroke", "#00FFCC")
                                            .attr("stroke-width", 5);

                                        const value = d3.select(this).attr("cx");
                                        svg.append("line")
                                            .attr("class", "reference-line")
                                            .attr("x1", value)
                                            .attr("x2", value)
                                            .attr("y1", 0)
                                            .attr("y2", height)
                                            .attr("stroke", "#00FFCC")
                                            .attr("stroke-dasharray", "5,5")
                                            .attr("stroke-width", 4);
                                    })
                                    .on("mousemove", moveTooltip)
                                    .on("mouseout", function () {
                                        hideTooltip();
                                        d3.select(this)
                                            .attr("stroke", null)
                                            .attr("stroke-width", null)
                                            .attr("fill", "#FF3B30")
                                            .attr("r", 10);
                                        svg.selectAll(".reference-line").remove();
                                    });
                            }
                        }
                    }
                }
            }
        }
    }

    updateStudentSelector("");
    drawBoxPlot("", "");
});