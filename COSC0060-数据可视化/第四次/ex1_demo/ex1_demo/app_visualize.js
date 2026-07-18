const appEvaluations = {
    "微信": "微信是您使用频率最高的应用，在10月23日达到峰值192.32分钟，使用时段主要集中在上午9-11点和下午15-17点的工作时间，可能用于工作沟通和社交联络。傍晚和夜间也有持续使用，但不如白天频繁，显示其在您日常生活中的核心地位。",
    "哔哩哔哩": "哔哩哔哩在10月22日使用时间最长（89.85分钟），高峰出现在下午16-17点，可能您在休闲时段观看视频内容放松。10月28日也有27.85分钟的使用时间，显示您对该平台的持续兴趣。",
    "小红书": "小红书是您使用时间第二长的应用，在10月27日达到136.78分钟的最高值，且凌晨时段（0-2点）有显著使用，可能您在深夜进行深度内容浏览。10月24日和28日都有超过100分钟的使用时间，表明您对该平台有较高的内容消费需求。",
    "Suki": "Suki在10月22日和23日使用时间相对稳定（约12-17分钟），高峰出现在下午时段，可能用于特定兴趣或学习活动。",
    "京东": "京东在10月22日使用时间较长（11.08分钟），但其他日期使用较少，可能您在特定日期进行购物或浏览商品。",
    "支付宝": "支付宝在10月24日使用时间最长（46.60分钟），使用时段分布较广，可能用于日常支付或金融服务。",
    "系统桌面": "系统桌面使用时间每日相对稳定（约10-18分钟），无明显高峰时段，可能作为手机操作的基础界面频繁使用。",
    "飞书": "飞书在10月27日使用时间显著增加（64.72分钟），且集中在特定时段，可能用于工作沟通或任务管理。",
    "番茄免费小说": "番茄免费小说在10月23日使用时间较长（7.67分钟），但其他日期使用较少，可能您在空闲时间阅读小说放松。",
    "懂车帝": "该应用有效信息较少，无法分析。",
    "养基宝": "养基宝在10月22-24日使用时间相对稳定（约4-6分钟），使用时段分散，可能用于理财或投资相关活动。",
    "小米设置": "该应用有效信息较少，无法分析。",
    "美团": "美团在10月25日使用时间较长（21.67分钟），高峰出现在下午和傍晚，可能用于外卖订购或本地服务。",
    "中国移动": "该应用有效信息较少，无法分析。",
    "云闪付": "云闪付在10月22-28日使用时间较短（均低于2分钟），可能仅用于偶尔的支付或查询服务。",
    "Via浏览器": "Via浏览器在10月28日使用时间较长（3.57分钟），但其他日期使用极少，可能作为备用浏览器偶尔使用。",
    "设置": "该应用有效信息较少，无法分析。",
    "时钟": "该应用有效信息较少，无法分析。",
    "天津地铁": "天津地铁在10月22-24日有使用记录，但每次使用时间都很短（1-2分钟），使用时段集中在上午8-9点和傍晚18-19点，可能用于通勤时段的路线查询或扫码乘车。",
    "可乐": "可乐应用几乎每日都有使用记录，但单次使用时间很短（0.5-1.5分钟），使用时段分布较广，可能用于日常记录或轻量级任务管理。",
    "京东金融": "京东金融在10月22-28日有使用记录，使用时间普遍较短（0.7-0.8分钟），显示您快速查询的使用习惯。",
    "应用商店": "该应用有效信息较少，无法分析。",
    "同花顺": "同花顺在10月25日使用时间较长（1.97分钟），但其他日期使用较少，可能用于股票或财经信息查询。",
    "ActivityWatch": "该应用有效信息较少，无法分析。",
    "Google Play 商店": "该应用有效信息较少，无法分析。",
    "Steam": "该应用有效信息较少，无法分析。",
    "安全中心": "该应用有效信息较少，无法分析。",
    "截屏": "该应用有效信息较少，无法分析。",
    "小米智能卡": "该应用有效信息较少，无法分析。",
    "QQ": "该应用有效信息较少，无法分析。",
    "三方应用异常分析": "该应用有效信息较少，无法分析。",
    "Clash": "该应用有效信息较少，无法分析。",
    "钉钉": "该应用有效信息较少，无法分析。",
    "闲鱼": "该应用有效信息较少，无法分析。",
    "应用包管理组件": "该应用有效信息较少，无法分析。",
    "计算器": "该应用有效信息较少，无法分析。",
    "IntentResolver": "该应用有效信息较少，无法分析。",
    "夸克浏览器": "该应用有效信息较少，无法分析。",
    "微博国际版": "该应用有效信息较少，无法分析。",
    "小米账号": "该应用有效信息较少，无法分析。",
    "短信": "该应用有效信息较少，无法分析。",
    "高德地图": "高德地图在10月24日和25日有短暂使用，可能用于导航或路线规划。",
    "通话界面": "通话界面在10月23日和25日有使用记录，但时间较短，可能用于接听或拨打电话。",
    "相机": "该应用有效信息较少，无法分析。",
    "相册": "该应用有效信息较少，无法分析。",
    "山姆会员店": "该应用有效信息较少，无法分析。",
    "快应用服务框架": "该应用有效信息较少，无法分析。",
    "拼多多": "该应用有效信息较少，无法分析。",
    "网易邮箱": "该应用有效信息较少，无法分析。",
    "com.max.xiaoheihe": "该应用有效信息较少，无法分析。",
    "com.core.bucd": "该应用有效信息较少，无法分析。",
    "com.comingx.zanao": "该应用有效信息较少，无法分析。",
    "com.bankcomm.Bankcomm": "该应用有效信息较少，无法分析。",
    "com.alibaba.aliyun": "该应用有效信息较少，无法分析。",
    "VpnDialogs": "该应用有效信息较少，无法分析。",
    "应用程序扩展服务": "该应用有效信息较少，无法分析。",
    "权限管理服务": "该应用有效信息较少，无法分析。",
    "系统界面组件": "该应用有效信息较少，无法分析。",
    "淘宝": "该应用有效信息较少，无法分析。"
};

const hourToShichen = {
    "0:00-0:59": "子时",
    "1:00-1:59": "丑时",
    "2:00-2:59": "丑时",
    "3:00-3:59": "寅时",
    "4:00-4:59": "寅时",
    "5:00-5:59": "卯时",
    "6:00-6:59": "卯时",
    "7:00-7:59": "辰时",
    "8:00-8:59": "辰时",
    "9:00-9:59": "巳时",
    "10:00-10:59": "巳时",
    "11:00-11:59": "午时",
    "12:00-12:59": "午时",
    "13:00-13:59": "未时",
    "14:00-14:59": "未时",
    "15:00-15:59": "申时",
    "16:00-16:59": "申时",
    "17:00-17:59": "酉时",
    "18:00-18:59": "酉时",
    "19:00-19:59": "戌时",
    "20:00-20:59": "戌时",
    "21:00-21:59": "亥时",
    "22:00-22:59": "亥时",
    "23:00-23:59": "子时"
};

const weekdayMap = {
    '0': 'Sun.',
    '1': 'Mon.',
    '2': 'Tue.',
    '3': 'Wed.',
    '4': 'Thu.',
    '5': 'Fri.',
    '6': 'Sat.'
};

function setAppSelector(data) {
    const appNames = [...new Set(data.map(d => d["应用名称"]))];
    const selector = document.getElementById("appSelector");
    appNames.forEach(appName => {
        const option = document.createElement("option");
        option.value = appName;
        option.textContent = appName;
        selector.appendChild(option);
    });
}
function visualize(data, appName) {
    // Update Analysis Panel
    const analysisContent = document.querySelector(".analysis-content");
    if (appEvaluations[appName])
        analysisContent.textContent = appEvaluations[appName];
    else
        analysisContent.textContent = `暂无分析！`;

    // Data Processing
    const appData = data.filter(d => d["应用名称"] === appName);
    const processedData = [];
    const shichenList = [...new Set(Object.values(hourToShichen))];
    const dateList = [...new Set(data.map(d => d["日期"]))];
    console.log("shichenList = \n", shichenList)
    console.log("dateList = \n", dateList)

    shichenList.forEach(shichen => {
        const group = {
            time: shichen,
            values: []
        };
        dateList.forEach(date => {
            let totalDuration = 0;
            const dateData = appData.find(d => d["日期"] === date);
            if (dateData) {
                Object.keys(hourToShichen).forEach(hourKey => {
                    if (hourToShichen[hourKey] === shichen)
                        totalDuration += parseFloat(dateData[hourKey]) || 0;
                });
            }
            group.values.push({
                date: date,
                duration: parseFloat(totalDuration.toFixed(2)),
                time: shichen
            });
        });
        processedData.push(group);
    });
    console.log("processedData = \n", processedData);

    // Visualization
    const width = 1200, height = 1200;
    const innerRadius = 200, outerRadius = 500;
    const svg = d3.select("#chart svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);
    svg.selectAll("*").remove();

    const x = d3.scaleBand()
        .domain(shichenList)
        .range([0, 2 * Math.PI])
        .padding(0.7);

    const maxDuration = d3.max(processedData, d => d3.max(d.values, v => v.duration));
    const y = d3.scaleLinear()
        .domain([0, maxDuration])
        .nice()
        .range([innerRadius, outerRadius]);
    console.log("maxDuration = ", maxDuration);
    console.log("y_max = ", y.domain()[1]);

    const color = d3.scaleOrdinal()
        .domain(dateList)
        .range([
            "#f46d43", "#d73027", "#a50026", "#66bd63", "#1a9850", "#efcd6f", "#fdae61"
        ]
        );


    const timeGroups = svg.append("g")
        .selectAll("g")
        .data(processedData)
        .enter()
        .append("g");

    timeGroups.selectAll("path")
        .data(group => group.values)
        .enter()
        .append("path")
        .attr("d", (element, idx) => {
            const startAngle = x(element.time);
            const endAngle = x(element.time) + x.bandwidth();
            const delta = y.domain()[1] * 0.075;
            const innerR = (element.duration) ? innerRadius + (element.duration - delta / 2) / y.domain()[1] * (outerRadius - innerRadius) : 0;
            const outerR = (element.duration) ? innerRadius + (element.duration + delta / 2) / y.domain()[1] * (outerRadius - innerRadius) : 0;
            return d3.arc()
                .innerRadius(innerR)
                .outerRadius(outerR)
                .startAngle(startAngle)
                .endAngle(endAngle)
                ();
        })
        .attr("fill", d => color(d.date))
        .on("mouseover", function (event, d) {
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .attr("id", "tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.75)")
                .style("color", "white")
                .style("padding", "10px")
                .style("border-radius", "5px")
                .style("pointer-events", "none")
                .style("font-size", "14px")
                .style("z-index", "1000");
            const dateObj = new Date(d.date);
            const weekday = weekdayMap[dateObj.getDay()];
            tooltip.html(`
                <strong>详细信息</strong><br>
                日期：${d.date} (${weekday})<br>
                使用时辰：${d.time}<br>
                使用时长：${d.duration.toFixed(2)} 分钟
            `);
        })
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            d3.select("#tooltip").remove();
        });

    svg.append("g").selectAll()
        .attr("text_anchor", "middle")
        .data(x.domain()).join("g")
        .attr("transform", d => `
                rotate(${((x(d) + x.bandwidth() / 2) / Math.PI * 180 - 90)})
                translate(${innerRadius - 10},0)
            `)
        .call(g => g.append("text")
            .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                ? "rotate(90)translate(-20,25)"
                : "rotate(-90)translate(-20,-10)"
            )
            .attr("font-size", "20px")
            .text(text => text))
        .call(g => g.append("line")
            .attr("x1", 10)
            .attr("x2", -10)
            .attr("stroke", "#000"));

    const yticks = d3.range(5).map(i => {
        const domain = y.domain();
        return domain[0] + (domain[1] - domain[0]) * i / 4;
    });
    svg.append("g")
        .call(g => g.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -y(yticks[yticks.length - 1]) - 20)
            .attr("font-size", "20px")
            .text("使用时长 (min)"))
        .call(g => g.selectAll("g")
            .data(yticks).join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#999")
                .attr("stroke-width", 1)
                .attr("r", y)
            )
            .call(g => g.append("text")
                .attr("font-size", "20px")
                .attr("text-anchor", "middle")
                .attr("y", d => -y(d) + 5)
                .attr("stroke", "#fff")
                .attr("stroke-width", 3)
                .text(d3.format(".2f"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")
            )
        );

    svg.append("g").selectAll()
        .data(color.domain()).join("g")
        .attr("transform", (d, i, nodes) => `translate(-104.6,${(- nodes.length / 2 + i) * 30})`)
        .call(g => g.append("rect")
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", color))
        .call(g => {

            g.append("text")
                .attr("font-size", "20px")
                .attr("x", 30)
                .attr("y", 20)
                .text(text => {
                    const dateObj = new Date(text);
                    const weekday = weekdayMap[dateObj.getDay()];
                    return `${text} (${weekday})`;
                });
        });

    svg.append("text")
        .attr("x", 0)
        .attr("y", -height / 2 + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "32px")
        .attr("font-weight", "bold")
        .text(appName + "使用情况统计");
}

document.addEventListener("DOMContentLoaded", function () {
    d3.csv("./data/app_usage_2025-10-28_7days.csv").then(function (data) {
        setAppSelector(data);
        document.getElementById("appSelector").addEventListener("change", function () {
            const selectedApp = this.value;
            if (selectedApp) {
                // d3.select("#chart svg")
                //     .attr("style", "width:85%;height:85%");
                visualize(data, selectedApp);
            }
            else {
                d3.select("#chart svg")
                    // .attr("style", "width:auto;height:150px")
                    .selectAll("*").remove();
                document.querySelector(".analysis-content").textContent = "请先选择一个应用";
            }
        });
    });
});