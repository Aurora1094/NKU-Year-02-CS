
const nodeIcons = {
    person: "./img/students.svg",
    knowledge: "./img/knowledge.svg",
    sub_knowledge: "./img/subknowledge.svg",
    question: "./img/question.svg"
};

const unselectedNodeIcons = {
    person: "./img/students.svg",
    knowledge: "./img/knowledge_noselected.svg",
    sub_knowledge: "./img/subknowledge_noselected.svg",
    question: "./img/question_noselected.svg"
};

const badNodeIcons = {
    person: "./img/students.svg",
    knowledge: "./img/knowledge_bad.svg",
    sub_knowledge: "./img/subknowledge_bad.svg",
    question: "./img/question_bad.svg"
};

const svg = d3.select("#knowledge-tree");
const width = 1200;
const height = 1100;
const centerX = (width - 200) / 2;
const centerY = 500;

svg.attr("viewBox", `0 -100 ${width} ${height}`);

const title = svg.append("text")
    .attr("id", "knowledge-tree-title")
    .attr("x", (width - 200) / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "48px")
    .attr("font-weight", "bold")
    .attr("fill", "white")
    .text("知识树可视化");

const legendGroup = svg.append("g")
    .attr("id", "knowledge-tree-legend")
    .attr("transform", `translate(${width - 250}, -80)`);

// const legendItems = [
//     { icon: nodeIcons.knowledge, label: "正常选中知识点", type: "knowledge" },
//     { icon: badNodeIcons.knowledge, label: "薄弱知识点", type: "knowledge" },
//     { icon: unselectedNodeIcons.knowledge, label: "未选中知识点", type: "knowledge" },
//     { icon: nodeIcons.sub_knowledge, label: "正常选中子知识点", type: "sub_knowledge" },
//     { icon: badNodeIcons.sub_knowledge, label: "薄弱子知识点", type: "sub_knowledge" },
//     { icon: unselectedNodeIcons.sub_knowledge, label: "未选中子知识点", type: "sub_knowledge" },
//     { icon: nodeIcons.question, label: "正常选中题目", type: "question" },
//     { icon: badNodeIcons.question, label: "薄弱题目", type: "question" },
//     { icon: unselectedNodeIcons.question, label: "未选中题目", type: "question" },
// ];

// const legendItem = legendGroup.selectAll()
//     .data(legendItems)
//     .enter()
//     .append("g")
//     .attr("transform", (d, i) => `translate(0, ${i * 40})`);

// legendItem.append("image")
//     .attr("xlink:href", d => d.icon)
//     .attr("x", 0)
//     .attr("y", 0)
//     .attr("width", 30)
//     .attr("height", 30);

// legendItem.append("text")
//     .attr("x", 40)
//     .attr("y", 23)
//     .attr("fill", "white")
//     .attr("font-size", "24px")
//     .text(d => d.label);

const legendItems = [
    { icon: "./img/knowledge_legend.svg", label: "知识点", type: "knowledge" },
    { icon: "./img/subknowledge_legend.svg", label: "子知识点", type: "sub_knowledge" },
    { icon: "./img/question_legend.svg", label: "题目", type: "question" },
    { color: "#00FF9D", label: "正常", type: "normal" },
    { color: "#FF5252", label: "薄弱", type: "weak" },
    { color: "#888888", label: "未选中", type: "unselected" },
];

const legendItem = legendGroup.selectAll()
    .data(legendItems)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 40})`);

legendItem.append("image")
    .attr("xlink:href", d => d.icon)
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", 30);

legendItem.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", 30)
    .attr("fill", d => d.color)
    .attr("display", d => d.color ? "block" : "none");

legendItem.append("text")
    .attr("x", 40)
    .attr("y", 23)
    .attr("fill", "white")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .text(d => d.label);

d3.csv("./data/Data_TitleInfo.csv").then(function (data) {

    d3.csv("./data/Integrated_Class_Data.csv").then(function (studentData) {
        const classes = [...new Set(studentData.map(d => d.Class_ID))]
            .sort((a, b) => {
                const numA = parseInt(a.replace('Class', ''));
                const numB = parseInt(b.replace('Class', ''));
                return numA - numB;
            });
        const classSelector = d3.select("#classSelector");

        classes.forEach(className => {
            classSelector.append("option").attr("value", className).text(className);
        });
        // classSelector.dispatch("change");

    });


    const knowledgeMap = new Map();
    const subKnowledgeMap = new Map();
    const questionMap = new Map();

    data.forEach(d => {
        if (!knowledgeMap.has(d.knowledge)) {
            knowledgeMap.set(d.knowledge, {
                id: d.knowledge,
                type: "knowledge",
                name: d.knowledge
            });
        }

        const subParts = d.sub_knowledge.split('_');
        const subName = subParts.length > 1 ? subParts.slice(1).join('_') : d.sub_knowledge;

        if (!subKnowledgeMap.has(subName)) {

            subKnowledgeMap.set(subName, {
                id: subName,
                type: "sub_knowledge",
                name: subName,
                parentKnowledge: d.knowledge
            });
        }

        if (!questionMap.has(d.title_ID)) {
            questionMap.set(d.title_ID, {
                id: d.title_ID,
                type: "question",
                name: d.title_ID,
                parentSubKnowledges: [subName]
            });
        } else {
            const existingQuestion = questionMap.get(d.title_ID);
            if (!existingQuestion.parentSubKnowledges.includes(subName)) {
                existingQuestion.parentSubKnowledges.push(subName);
            }
        }
    });

    const nodes = [];
    const links = [];

    const personNode = {
        id: "person",
        type: "person",
        name: "人",
        x: centerX,
        y: centerY,
        radius: 40
    };
    nodes.push(personNode);

    function alternatingSort(items, getChildCount) {
        const sortedItems = [...items].sort((a, b) => getChildCount(b) - getChildCount(a));
        const result = [];
        let left = 0;
        let right = sortedItems.length - 1;
        let takeFromLeft = true;

        while (left <= right) {
            if (takeFromLeft) {
                result.push(sortedItems[left]);
                left++;
            } else {
                result.push(sortedItems[right]);
                right--;
            }
            takeFromLeft = !takeFromLeft;
        }
        return result;
    }

    const knowledges = Array.from(knowledgeMap.values());
    const knowledgeToQuestionCount = new Map();
    knowledges.forEach(k => {
        const subKnowledgesOfK = Array.from(subKnowledgeMap.values())
            .filter(sk => sk.parentKnowledge === k.id);

        const relatedQuestions = new Set();
        subKnowledgesOfK.forEach(sk => {
            Array.from(questionMap.values())
                .filter(q => q.parentSubKnowledges && q.parentSubKnowledges.includes(sk.id))
                .forEach(q => relatedQuestions.add(q.id));
        });
        knowledgeToQuestionCount.set(k, relatedQuestions.size);
    });

    const sortedKnowledges = alternatingSort(knowledges, k => knowledgeToQuestionCount.get(k));

    const knowledgeRadius = 150;
    const knowledgeCount = sortedKnowledges.length;

    sortedKnowledges.forEach((knowledge, i) => {
        const angle = (i / knowledgeCount) * 2 * Math.PI - Math.PI / 2;
        knowledge.x = centerX + knowledgeRadius * Math.cos(angle);
        knowledge.y = centerY + knowledgeRadius * Math.sin(angle);
        knowledge.radius = 25;
        nodes.push(knowledge);
        links.push({
            source: personNode,
            target: knowledge
        });
    });


    const subKnowledges = Array.from(subKnowledgeMap.values());
    const subKnowledgeByParent = {};
    subKnowledges.forEach(sk => {
        if (!subKnowledgeByParent[sk.parentKnowledge]) {
            subKnowledgeByParent[sk.parentKnowledge] = [];
        }
        subKnowledgeByParent[sk.parentKnowledge].push(sk);
    });
    const subKnowledgeToQuestionCount = new Map();
    subKnowledges.forEach(sk => {
        const questionCount = Array.from(questionMap.values())
            .filter(q => q.parentSubKnowledges && q.parentSubKnowledges.includes(sk.id)).length;
        subKnowledgeToQuestionCount.set(sk, questionCount);
    });

    const orderedSubKnowledges = [];
    sortedKnowledges.forEach(knowledge => {
        if (subKnowledgeByParent[knowledge.id]) {
            const sortedSubKnowledges = alternatingSort(
                subKnowledgeByParent[knowledge.id],
                sk => subKnowledgeToQuestionCount.get(sk)
            );
            orderedSubKnowledges.push(...sortedSubKnowledges);
        }
    });

    const subKnowledgeRadius = 300;
    const subKnowledgeCount = orderedSubKnowledges.length;

    orderedSubKnowledges.forEach((subKnowledge, i) => {
        const angle = (i / subKnowledgeCount) * 2 * Math.PI - Math.PI / 2;
        subKnowledge.x = centerX + subKnowledgeRadius * Math.cos(angle);
        subKnowledge.y = centerY + subKnowledgeRadius * Math.sin(angle);
        subKnowledge.radius = 25;
        nodes.push(subKnowledge);
        const parentKnowledge = sortedKnowledges.find(k => k.id === subKnowledge.parentKnowledge);
        if (parentKnowledge) {
            links.push({
                source: parentKnowledge,
                target: subKnowledge
            });
        }
    });

    const questions = Array.from(questionMap.values());
    const orderedQuestions = [];
    orderedSubKnowledges.forEach(subKnowledge => {
        const relatedQuestions = questions.filter(q =>
            q.parentSubKnowledges.includes(subKnowledge.id)
        );

        relatedQuestions.forEach(question => {
            if (!orderedQuestions.some(q => q.id === question.id)) {
                orderedQuestions.push(question);
            }
            links.push({
                source: subKnowledge,
                target: question
            });
        });
    });

    const questionRadius = 450;
    const questionCount = orderedQuestions.length;
    const maxQuestionsPerSubKnowledge = Math.max(...subKnowledgeToQuestionCount.values());
    const offsetValue = Math.floor(maxQuestionsPerSubKnowledge / 2);

    orderedQuestions.forEach((question, i) => {
        const angle = ((i - offsetValue) / questionCount) * 2 * Math.PI - Math.PI / 2;
        question.x = centerX + questionRadius * Math.cos(angle);
        question.y = centerY + questionRadius * Math.sin(angle);
        question.radius = 25;
        nodes.push(question);
    });

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("d", createCurvedLink)
        .attr("stroke", d => {
            const selectedClass = d3.select("#classSelector").property("value");
            const selectedStudent = d3.select("#studentSelector").property("value");
            if (isWeakPoint(selectedClass, selectedStudent, d.source.id, d.source.type))
                return "#FF5252";
            else {
                switch (d.source.type) {
                    case "person":
                        return "#DA954B";
                    case "knowledge":
                        return "#00ff9d";
                    case "sub_knowledge":
                        return "#00ff9d";
                    default:
                        return "#999";
                }
            }
        })
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.6)
        .attr("fill", "none");


    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    const tooltip = d3.select("body").append("div")
        .attr("class", "knowledge-tree-tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "14px")
        .style("z-index", "10")
        .style("display", "none");

    node.on("mouseover", function (event, d) {
        let tooltipContent = "";
        const selectedClass = d3.select("#classSelector").property("value");
        const selectedStudent = d3.select("#studentSelector").property("value");

        switch (d.type) {
            case "person":
                if (selectedClass)
                    tooltipContent += `班级: ${selectedClass} <br>
                                学生: ${selectedStudent} </br>`;
                tooltipContent += `<center>(点击此处恢复全局视图)</center>`;
                break;
            case "knowledge":
                const subKnowledgeCount = Array.from(subKnowledgeMap.values())
                    .filter(sk => sk.parentKnowledge === d.id).length;
                const relatedQuestions = new Set();
                const subKnowledgesOfThis = Array.from(subKnowledgeMap.values())
                    .filter(sk => sk.parentKnowledge === d.id);
                subKnowledgesOfThis.forEach(sk => {
                    Array.from(questionMap.values())
                        .filter(q => q.parentSubKnowledges && q.parentSubKnowledges.includes(sk.id))
                        .forEach(q => relatedQuestions.add(q.id));
                });
                const questionCount = relatedQuestions.size;

                tooltipContent = `<center><strong>知识点 ${d.id}</strong></center>
                            下属子知识点数量: ${subKnowledgeCount}<br>
                            下属题目数量: ${questionCount}`;
                if (selectedClass) {
                    if (selectedStudent && selectedStudent !== "全部") {
                        const studentProf = calculateProficiency(selectedClass, selectedStudent, d.id, d.type);
                        tooltipContent += `<br>学生掌握程度: ${studentProf.toFixed(2)}`;
                        const classProf = calculateProficiency(selectedClass, null, d.id, d.type);
                        tooltipContent += `<br>班级掌握程度: ${classProf.toFixed(2)}`;
                    } else {
                        const classProf = calculateProficiency(selectedClass, null, d.id, d.type);
                        tooltipContent += `<br>班级掌握程度: ${classProf.toFixed(2)}`;
                        const allProf = calculateProficiency(null, null, d.id, d.type);
                        tooltipContent += `<br>全体掌握程度: ${allProf.toFixed(2)}`;
                    }
                }
                tooltipContent += `<center>(点击此处查看下属子知识点与题目)</center>`;
                break;

            case "sub_knowledge":
                const childQuestionCount = Array.from(questionMap.values())
                    .filter(q => q.parentSubKnowledges && q.parentSubKnowledges.includes(d.id)).length;
                tooltipContent = `<center><strong>子知识点 ${d.name}</strong></center>
                            所属知识点: ${d.parentKnowledge}<br>
                            下属题目数量: ${childQuestionCount}`;
                if (selectedClass) {
                    if (selectedStudent && selectedStudent !== "全部") {
                        const studentProf = calculateProficiency(selectedClass, selectedStudent, d.id, d.type);
                        tooltipContent += `<br>学生掌握程度: ${studentProf.toFixed(2)}`;
                        const classProf = calculateProficiency(selectedClass, null, d.id, d.type);
                        tooltipContent += `<br>班级掌握程度: ${classProf.toFixed(2)}`;
                    } else {
                        const classProf = calculateProficiency(selectedClass, null, d.id, d.type);
                        tooltipContent += `<br>班级掌握程度: ${classProf.toFixed(2)}`;
                        const allProf = calculateProficiency(null, null, d.id, d.type);
                        tooltipContent += `<br>全体掌握程度: ${allProf.toFixed(2)}`;
                    }
                }
                tooltipContent += `<center>(点击此处查看所属知识点与下属题目)</center>`;
                break;

            case "question":
                tooltipContent = `<center><strong>题目 ${d.name}</strong></center>
                            所属子知识点: ${d.parentSubKnowledges ? d.parentSubKnowledges.join(', ') : d.parentSubKnowledge}`;
                if (selectedClass) {
                    if (selectedStudent && selectedStudent !== "全部") {
                        const studentProf = calculateProficiency(selectedClass, selectedStudent, d.id, d.type);
                        tooltipContent += `<br><strong>学生掌握程度:</strong> ${studentProf.toFixed(2)}`;
                        const classProf = calculateProficiency(selectedClass, null, d.id, d.type);
                        tooltipContent += `<br><strong>班级掌握程度:</strong> ${classProf.toFixed(2)}`;
                    } else {
                        const classProf = calculateProficiency(selectedClass, null, d.id, d.type);
                        tooltipContent += `<br><strong>班级掌握程度:</strong> ${classProf.toFixed(2)}`;
                        const allProf = calculateProficiency(null, null, d.id, d.type);
                        tooltipContent += `<br><strong>全体掌握程度:</strong> ${allProf.toFixed(2)}`;
                    }
                }
                tooltipContent += `<center>(点击此处查看所属知识点与子知识点)</center>`;
                break;
        }

        tooltip.html(tooltipContent)
            .style("display", "block");
    })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
            if (d.type === "person") {
                resetAllNodesAndLinks();
            } else {
                highlightRelatedNodesAndLinks(d);
            }
            if (d.type === "question") {
                d3.select("#questionSelector").property("value", d.id);
                // 触发 change 事件
                d3.select("#questionSelector").dispatch('change');
            }
        });

    const icons = node.append("image")
        .attr("xlink:href", d => nodeIcons[d.type])
        .attr("x", d => -d.radius)
        .attr("y", d => -d.radius)
        .attr("width", d => d.radius * 2)
        .attr("height", d => d.radius * 2);

    function createCurvedLink(d) {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.7;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }


    let relatedNodeIds;
    function highlightRelatedNodesAndLinks(selectedNode) {
        relatedNodeIds = new Set();

        relatedNodeIds.add(selectedNode.id);
        if (selectedNode.type === "knowledge") {
            relatedNodeIds.add("person");

            Array.from(subKnowledgeMap.values())
                .filter(sk => sk.parentKnowledge === selectedNode.id)
                .forEach(sk => {
                    relatedNodeIds.add(sk.id);
                    Array.from(questionMap.values())
                        .filter(q => q.parentSubKnowledges.includes(sk.id))
                        .forEach(q => relatedNodeIds.add(q.id));
                });

        } else if (selectedNode.type === "sub_knowledge") {
            relatedNodeIds.add(selectedNode.parentKnowledge);
            relatedNodeIds.add("person");
            Array.from(questionMap.values())
                .filter(q => q.parentSubKnowledges.includes(selectedNode.id))
                .forEach(q => relatedNodeIds.add(q.id));

        } else if (selectedNode.type === "question") {
            selectedNode.parentSubKnowledges.forEach(subId => {
                relatedNodeIds.add(subId);
                const subKnowledge = subKnowledgeMap.get(subId);
                if (subKnowledge) {
                    relatedNodeIds.add(subKnowledge.parentKnowledge);
                    relatedNodeIds.add("person");
                }
            });
        }
        updateNodeIcons();

        link.attr("stroke", d => {
            if (relatedNodeIds.has(d.source.id) && relatedNodeIds.has(d.target.id)) {
                const selectedClass = d3.select("#classSelector").property("value");
                const selectedStudent = d3.select("#studentSelector").property("value");
                if (isWeakPoint(selectedClass, selectedStudent, d.source.id, d.source.type))
                    return "#FF5252";
                else {
                    switch (d.source.type) {
                        case "person":
                            return "#DA954B";
                        case "knowledge":
                            return "#00ff9d";
                        case "sub_knowledge":
                            return "#00ff9d";
                    }
                }
            } else return "#888888";
        })
            .attr("stroke-opacity", d => {
                if (relatedNodeIds.has(d.source.id) && relatedNodeIds.has(d.target.id)) {
                    return 0.6;
                } else {
                    return 0.1;
                }
            });
    }

    function resetAllNodesAndLinks() {
        relatedNodeIds = null;
        updateNodeIcons();
        link.attr("stroke", d => {
            const selectedClass = d3.select("#classSelector").property("value");
            const selectedStudent = d3.select("#studentSelector").property("value");
            if (isWeakPoint(selectedClass, selectedStudent, d.source.id, d.source.type))
                return "#FF5252";
            else {
                switch (d.source.type) {
                    case "person":
                        return "#DA954B";
                    case "knowledge":
                        return "#00ff9d";
                    case "sub_knowledge":
                        return "#00ff9d";
                }
            }
        })
            .attr("stroke-opacity", 0.6);
    }

    function updateNodeIcons() {
        const selectedClass = d3.select("#classSelector").property("value");
        const selectedStudent = d3.select("#studentSelector").property("value");

        d3.selectAll(".nodes image").attr("xlink:href", d =>
            getNodeIcon(d, selectedClass, selectedStudent)
        );
    }

    function getNodeIcon(d, selectedClass, selectedStudent) {
        if ((relatedNodeIds != null) && (!relatedNodeIds.has(d.id)))
            return unselectedNodeIcons[d.type];
        if (isWeakPoint(selectedClass, selectedStudent, d.id, d.type)) return badNodeIcons[d.type];
        return nodeIcons[d.type];
    }


    let proficiencyData;
    d3.csv("./data/proficiency.csv").then(function (profdata) {
        proficiencyData = profdata;
        preprocessProficiencyData();
        // console.log(proficiencyData);
        d3.select("#classSelector").on("change.knowledge-tree", function () {
            const selectedClass = d3.select(this).property("value");
            d3.select("#studentSelector")
                .selectAll("option:not(:first-child)")
                .remove();

            if (selectedClass) {
                const students = [...new Set(proficiencyData
                    .filter(d => d['班级'] === selectedClass)
                    .map(d => d['学生ID']))
                ].sort();

                const studentSelector = d3.select("#studentSelector");
                students.forEach(student => {
                    studentSelector.append("option")
                        .attr("value", student)
                        .text(student);
                });
            }
            updateTitle();
            resetAllNodesAndLinks();

            d3.select("#questionSelector").property("value", "");
            d3.select("#questionSelector").dispatch('change');
        });
        d3.select("#classSelector").dispatch("change");
    });

    let studentQuestionMap = {}; // 学生->题目 掌握程度映射
    let studentSubKnowledgeMap = {}; // 学生->子知识点 掌握程度映射
    let studentKnowledgeMap = {}; // 学生->知识点 掌握程度映射
    let classQuestionMap = {}; // 班级->题目 掌握程度映射
    let classSubKnowledgeMap = {}; // 班级->子知识点 掌握程度映射
    let classKnowledgeMap = {}; // 班级->知识点 掌握程度映射
    let allQuestionMap = {}; // 所有学生->题目 掌握程度映射
    let allSubKnowledgeMap = {}; // 所有学生->子知识点 掌握程度映射
    let allKnowledgeMap = {}; // 所有学生->知识点 掌握程度映射

    function preprocessProficiencyData() {
        studentQuestionMap = {};
        studentSubKnowledgeMap = {};
        studentKnowledgeMap = {};
        classQuestionMap = {};
        classSubKnowledgeMap = {};
        classKnowledgeMap = {};
        allQuestionMap = {};
        allSubKnowledgeMap = {};
        allKnowledgeMap = {};
        proficiencyData.forEach(record => {
            const studentId = record['学生ID'];
            const classId = record['班级'];
            const questionId = record['题目编号'];
            const subKnowledge = record['子知识点'];
            const knowledge = record['知识点'];
            const proficiency = parseFloat(record['掌握程度']);
            if (!studentQuestionMap[studentId]) {
                studentQuestionMap[studentId] = {};
            }
            studentQuestionMap[studentId][questionId] = proficiency;
            if (!studentSubKnowledgeMap[studentId]) {
                studentSubKnowledgeMap[studentId] = {};
            }
            if (!studentSubKnowledgeMap[studentId][subKnowledge]) {
                studentSubKnowledgeMap[studentId][subKnowledge] = {};
            }
            studentSubKnowledgeMap[studentId][subKnowledge][questionId] = proficiency;

            if (!studentKnowledgeMap[studentId]) {
                studentKnowledgeMap[studentId] = {};
            }
            if (!studentKnowledgeMap[studentId][knowledge]) {
                studentKnowledgeMap[studentId][knowledge] = {};
            }
            if (!studentKnowledgeMap[studentId][knowledge][subKnowledge]) {
                studentKnowledgeMap[studentId][knowledge][subKnowledge] = {};
            }
            studentKnowledgeMap[studentId][knowledge][subKnowledge][questionId] = proficiency;

            if (!classQuestionMap[classId]) {
                classQuestionMap[classId] = {};
            }
            if (!classQuestionMap[classId][questionId]) {
                classQuestionMap[classId][questionId] = [];
            }
            classQuestionMap[classId][questionId].push({
                studentId: studentId,
                proficiency: proficiency
            });

            if (!classSubKnowledgeMap[classId]) {
                classSubKnowledgeMap[classId] = {};
            }
            if (!classSubKnowledgeMap[classId][subKnowledge]) {
                classSubKnowledgeMap[classId][subKnowledge] = [];
            }
            classSubKnowledgeMap[classId][subKnowledge].push({
                studentId: studentId,
                questionId: questionId,
                proficiency: proficiency
            });

            if (!classKnowledgeMap[classId]) {
                classKnowledgeMap[classId] = {};
            }
            if (!classKnowledgeMap[classId][knowledge]) {
                classKnowledgeMap[classId][knowledge] = [];
            }
            classKnowledgeMap[classId][knowledge].push({
                studentId: studentId,
                subKnowledge: subKnowledge,
                questionId: questionId,
                proficiency: proficiency
            });

            if (!allQuestionMap[questionId]) {
                allQuestionMap[questionId] = [];
            }
            allQuestionMap[questionId].push({
                studentId: studentId,
                classId: classId,
                proficiency: proficiency
            });

            if (!allSubKnowledgeMap[subKnowledge]) {
                allSubKnowledgeMap[subKnowledge] = [];
            }
            allSubKnowledgeMap[subKnowledge].push({
                studentId: studentId,
                questionId: questionId,
                proficiency: proficiency
            });

            if (!allKnowledgeMap[knowledge]) {
                allKnowledgeMap[knowledge] = [];
            }
            allKnowledgeMap[knowledge].push({
                studentId: studentId,
                subKnowledge: subKnowledge,
                questionId: questionId,
                proficiency: proficiency
            });
        });
    }

    function calculateProficiency(targetClass, targetStudent, nodeId, nodeType) {
        if (targetStudent && nodeType === "question") {
            if (studentQuestionMap[targetStudent] && studentQuestionMap[targetStudent][nodeId] !== undefined) {
                return studentQuestionMap[targetStudent][nodeId];
            }
            return 0;
        }

        if (targetStudent && nodeType === "sub_knowledge") {
            if (studentSubKnowledgeMap[targetStudent] && studentSubKnowledgeMap[targetStudent][nodeId]) {
                const questions = studentSubKnowledgeMap[targetStudent][nodeId];
                const values = Object.values(questions);
                if (values.length > 0) {
                    const sum = values.reduce((acc, val) => acc + val, 0);
                    return sum / values.length;
                }
            }
            return 0;
        }

        if (targetStudent && nodeType === "knowledge") {
            if (studentKnowledgeMap[targetStudent] && studentKnowledgeMap[targetStudent][nodeId]) {
                const subKnowledges = studentKnowledgeMap[targetStudent][nodeId];
                const subKnowledgeProficiencies = [];

                for (const subKnowledge in subKnowledges) {
                    const questions = subKnowledges[subKnowledge];
                    const values = Object.values(questions);
                    if (values.length > 0) {
                        const sum = values.reduce((acc, val) => acc + val, 0);
                        subKnowledgeProficiencies.push(sum / values.length);
                    }
                }

                if (subKnowledgeProficiencies.length > 0) {
                    const sum = subKnowledgeProficiencies.reduce((acc, val) => acc + val, 0);
                    return sum / subKnowledgeProficiencies.length;
                }
            }
            return 0;
        }

        if (targetClass && !targetStudent && nodeType === "question") {
            if (classQuestionMap[targetClass] && classQuestionMap[targetClass][nodeId]) {
                const records = classQuestionMap[targetClass][nodeId];
                if (records.length > 0) {
                    const studentMap = {};
                    records.forEach(record => {
                        if (!studentMap[record.studentId]) {
                            studentMap[record.studentId] = record.proficiency;
                        }
                    });

                    const values = Object.values(studentMap);
                    const sum = values.reduce((acc, val) => acc + val, 0);
                    return sum / values.length;
                }
            }
            return 0;
        }

        if (targetClass && !targetStudent && nodeType === "sub_knowledge") {
            if (classSubKnowledgeMap[targetClass] && classSubKnowledgeMap[targetClass][nodeId]) {
                const records = classSubKnowledgeMap[targetClass][nodeId];
                const studentProfMap = {};

                records.forEach(record => {
                    if (!studentProfMap[record.studentId]) {
                        studentProfMap[record.studentId] = [];
                    }
                    studentProfMap[record.studentId].push(record.proficiency);
                });
                const studentAvgs = [];
                for (const studentId in studentProfMap) {
                    const profs = studentProfMap[studentId];
                    const avg = profs.reduce((acc, val) => acc + val, 0) / profs.length;
                    studentAvgs.push(avg);
                }

                if (studentAvgs.length > 0) {
                    const sum = studentAvgs.reduce((acc, val) => acc + val, 0);
                    return sum / studentAvgs.length;
                }
            }
            return 0;
        }

        if (targetClass && !targetStudent && nodeType === "knowledge") {
            if (classKnowledgeMap[targetClass] && classKnowledgeMap[targetClass][nodeId]) {
                const records = classKnowledgeMap[targetClass][nodeId];
                const studentProfMap = {};

                records.forEach(record => {
                    if (!studentProfMap[record.studentId]) {
                        studentProfMap[record.studentId] = [];
                    }
                    studentProfMap[record.studentId].push({
                        subKnowledge: record.subKnowledge,
                        proficiency: record.proficiency
                    });
                });

                const studentAvgs = [];
                for (const studentId in studentProfMap) {
                    const studentRecords = studentProfMap[studentId];
                    const subKnowledgeMap = {};
                    studentRecords.forEach(record => {
                        if (!subKnowledgeMap[record.subKnowledge]) {
                            subKnowledgeMap[record.subKnowledge] = [];
                        }
                        subKnowledgeMap[record.subKnowledge].push(record.proficiency);
                    });

                    const subKnowledgeAvgs = [];
                    for (const subKnowledge in subKnowledgeMap) {
                        const profs = subKnowledgeMap[subKnowledge];
                        const avg = profs.reduce((acc, val) => acc + val, 0) / profs.length;
                        subKnowledgeAvgs.push(avg);
                    }

                    if (subKnowledgeAvgs.length > 0) {
                        const avg = subKnowledgeAvgs.reduce((acc, val) => acc + val, 0) / subKnowledgeAvgs.length;
                        studentAvgs.push(avg);
                    }
                }

                if (studentAvgs.length > 0) {
                    const sum = studentAvgs.reduce((acc, val) => acc + val, 0);
                    return sum / studentAvgs.length;
                }
            }
            return 0;
        }

        if (!targetClass && !targetStudent && nodeType === "question") {
            if (allQuestionMap[nodeId]) {
                const records = allQuestionMap[nodeId];
                const studentMap = {};
                records.forEach(record => {
                    if (!studentMap[record.studentId]) {
                        studentMap[record.studentId] = record.proficiency;
                    }
                });

                const values = Object.values(studentMap);
                if (values.length > 0) {
                    const sum = values.reduce((acc, val) => acc + val, 0);
                    return sum / values.length;
                }
            }
            return 0;
        }


        if (!targetClass && !targetStudent && nodeType === "sub_knowledge") {
            if (allSubKnowledgeMap[nodeId]) {
                const records = allSubKnowledgeMap[nodeId];
                const studentProfMap = {};

                records.forEach(record => {
                    if (!studentProfMap[record.studentId]) {
                        studentProfMap[record.studentId] = [];
                    }
                    studentProfMap[record.studentId].push(record.proficiency);
                });

                const studentAvgs = [];
                for (const studentId in studentProfMap) {
                    const profs = studentProfMap[studentId];
                    const avg = profs.reduce((acc, val) => acc + val, 0) / profs.length;
                    studentAvgs.push(avg);
                }

                if (studentAvgs.length > 0) {
                    const sum = studentAvgs.reduce((acc, val) => acc + val, 0);
                    return sum / studentAvgs.length;
                }
            }
            return 0;
        }

        if (!targetClass && !targetStudent && nodeType === "knowledge") {
            if (allKnowledgeMap[nodeId]) {
                const records = allKnowledgeMap[nodeId];
                const studentProfMap = {};

                records.forEach(record => {
                    if (!studentProfMap[record.studentId]) {
                        studentProfMap[record.studentId] = [];
                    }
                    studentProfMap[record.studentId].push({
                        subKnowledge: record.subKnowledge,
                        proficiency: record.proficiency
                    });
                });

                const studentAvgs = [];
                for (const studentId in studentProfMap) {
                    const studentRecords = studentProfMap[studentId];
                    const subKnowledgeMap = {};
                    studentRecords.forEach(record => {
                        if (!subKnowledgeMap[record.subKnowledge]) {
                            subKnowledgeMap[record.subKnowledge] = [];
                        }
                        subKnowledgeMap[record.subKnowledge].push(record.proficiency);
                    });

                    const subKnowledgeAvgs = [];
                    for (const subKnowledge in subKnowledgeMap) {
                        const profs = subKnowledgeMap[subKnowledge];
                        const avg = profs.reduce((acc, val) => acc + val, 0) / profs.length;
                        subKnowledgeAvgs.push(avg);
                    }

                    if (subKnowledgeAvgs.length > 0) {
                        const avg = subKnowledgeAvgs.reduce((acc, val) => acc + val, 0) / subKnowledgeAvgs.length;
                        studentAvgs.push(avg);
                    }
                }

                if (studentAvgs.length > 0) {
                    const sum = studentAvgs.reduce((acc, val) => acc + val, 0);
                    return sum / studentAvgs.length;
                }
            }
            return 0;
        }

        return 0;
    }

    function isWeakPoint(selectedClass, selectedStudent, nodeId, nodeType) {
        if (!selectedClass) return false;
        if (selectedStudent && selectedStudent !== "全部") {
            const studentProficiency = calculateProficiency(selectedClass, selectedStudent, nodeId, nodeType);
            const classProficiency = calculateProficiency(selectedClass, null, nodeId, nodeType);
            return studentProficiency < classProficiency;
        } else {
            const classProficiency = calculateProficiency(selectedClass, null, nodeId, nodeType);
            const allProficiency = calculateProficiency(null, null, nodeId, nodeType);
            return classProficiency < allProficiency;
        }
    }

    function updateTitle() {
        const selectedClass = d3.select("#classSelector").property("value");
        const selectedStudent = d3.select("#studentSelector").property("value");

        let titleText = "知识树可视化";
        if (selectedClass) {
            if (selectedStudent && selectedStudent !== "全部") {
                titleText = `${selectedClass} 所选学生知识树可视化`;
            } else {
                titleText = `${selectedClass} 全体学生知识树可视化`;
            }
        }

        d3.select("#knowledge-tree-title").text(titleText);
    }

    // d3.select("#classSelector").on("change.knowledge-tree", function () {
    //     const selectedClass = d3.select(this).property("value");
    //     d3.select("#studentSelector")
    //         .selectAll("option:not(:first-child)")
    //         .remove();

    //     if (selectedClass) {
    //         const students = [...new Set(proficiencyData
    //             .filter(d => d['班级'] === selectedClass)
    //             .map(d => d['学生ID']))
    //         ].sort();

    //         const studentSelector = d3.select("#studentSelector");
    //         students.forEach(student => {
    //             studentSelector.append("option")
    //                 .attr("value", student)
    //                 .text(student);
    //         });
    //     }
    //     updateTitle();
    //     resetAllNodesAndLinks();
    // });


    d3.select("#studentSelector").on("change.knowledge-tree", function () {
        updateTitle();
        resetAllNodesAndLinks();

        d3.select("#questionSelector").property("value", "");
        d3.select("#questionSelector").dispatch('change');
    });

}).catch(function (error) {
    console.error('Error loading the CSV file:', error);
});
