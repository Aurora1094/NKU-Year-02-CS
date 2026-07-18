

/**
 * 文件路径: ChinaVis/vis/3/radar.js
 * 作用：封装雷达图的初始化、更新逻辑（仅保留 knowledge：知识点掌握度）
 */

export const RadarModule = {
  chart: null,
  gradients: null, // 存放各种渐变

  // 存一份“真实知识点数据”
  knowledgeData: {
    labels: [],
    personal: [],
    classAvg: []
  },

  /**
   * 初始化雷达图，只做一次
   * @param {string} canvasId - canvas 的 id，例如 'radarChart'
   */
  init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('[RadarModule] 未找到 canvas 元素:', canvasId);
      return;
    }
    if (typeof Chart === 'undefined') {
      console.warn('[RadarModule] Chart.js 未加载，无法初始化雷达图');
      return;
    }

    const ctx = canvas.getContext('2d');

    // =========================
    // 1. 创建渐变
    // =========================
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.max(canvas.width, canvas.height) / 2;

    // 个人区域填充：中心亮青色 → 外围透明
    const personalFill = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    personalFill.addColorStop(0, 'rgba(56, 189, 248, 0.45)'); // #38bdf8
    personalFill.addColorStop(1, 'rgba(8, 47, 73, 0.0)');

    // 个人轮廓线：青色渐变
    const personalBorder = ctx.createLinearGradient(0, 0, canvas.width, 0);
    personalBorder.addColorStop(0, '#22d3ee');
    personalBorder.addColorStop(1, '#38bdf8');

    // 班级平均线：灰蓝渐变
    const classBorder = ctx.createLinearGradient(0, 0, canvas.width, 0);
    classBorder.addColorStop(0, 'rgba(148, 163, 184, 0.1)');
    classBorder.addColorStop(1, 'rgba(148, 163, 184, 0.7)');

    this.gradients = { personalFill, personalBorder, classBorder };

    // =========================
    // 2. 初始化空图
    // =========================
    this.chart = new Chart(ctx, {
      type: 'radar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: true, axis: 'r' },

        scales: {
          r: {
            max: 100,
            min: 0,
            angleLines: { color: 'rgba(255,255,255,0.03)' },
            grid: { color: 'rgba(255,255,255,0.05)', circular: true },
            pointLabels: { color: '#64748b', font: { size: 9 } },
            ticks: { display: false, maxTicksLimit: 3 },
            suggestedMin: 0,
            suggestedMax: 80
          }
        },

        plugins: {
          legend: { display: false },

          title: {
        display: true,                // 开启标题显示
        text: '知识点掌握度',          // 标题文字
        color: '#ffffff',             // 字体颜色（白色）
        font: {
            size: 20,                 // 字体大小
            weight: 'bold',           // 字体加粗
            family: "sans-serif"      // 字体族
        },
        padding: {
            top: 10,                  // 标题距离顶部的间距
            bottom: 20                // 标题距离图表的间距
        }
    },

  tooltip: {
    enabled: true,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderColor: '#22d3ee',
    borderWidth: 1,
    padding: 8,
    displayColors: false,

    // =========================================
    // 【新增】过滤器逻辑
    // 作用：当多个维度都是 0 分时，圆心只显示一条“个人：0.0 分”
    // =========================================
    filter: function(tooltipItem, index, tooltipItems) {
      // 1. 获取当前数值 (兼容写法)
      const value = tooltipItem.raw;

      // 2. 如果数值大于 0，不做去重，正常显示
      // (因为非0的点在雷达图上是分散的，不会重叠，不需要去重)
      if (value > 0) return true;

      // 3. 如果数值是 0，检查它是不是列表里的“第一个”
      // 我们在当前的 tooltipItems 数组中查找属于同一组数据(datasetIndex相同)且值为0的第一个元素
      const firstMatchIndex = tooltipItems.findIndex(item => 
        item.datasetIndex === tooltipItem.datasetIndex && item.raw === value
      );

      // 只有当前项的下标 等于 找到的第一个下标时，才显示
      // 这样后续重复的 0 分项就会被 return false 过滤掉
      return index === firstMatchIndex;
    },
            callbacks: {
              title: (items) => (items.length ? (items[0].label || '') : ''),
              label: (ctx) => {
                const datasetLabel = ctx.dataset.label || '';
                const value = ctx.parsed.r ?? ctx.raw;
                const v =
                  typeof value === 'number' && !Number.isNaN(value)
                    ? value.toFixed(1)
                    : value;

                if (datasetLabel === '个人') return `个人：${v} 分`;
                if (datasetLabel === '班级平均') return `班级平均：${v} 分`;
                return `${datasetLabel}: ${v}`;
              }
            }
          }
        },

        elements: {
          line: { borderWidth: 1.8 },
          point: {
            radius: 2.2,
            hitRadius: 8,
            hoverRadius: 5,
            hoverBorderWidth: 2,
            hoverBackgroundColor: '#f97316'
          }
        }
      }
    });

    // 初始化时渲染一份 knowledge（无数据则占位）
    this._renderKnowledge();
  },

  /**
   * 外部调用：更新“知识点掌握度”的真实数据
   * @param {string[]} labels - 知识点名称
   * @param {number[]} personalData - 个人掌握度（0~100）
   * @param {number[]} classAvgData - 班级平均掌握度（0~100）
   */
  update(labels, personalData, classAvgData) {
    this.knowledgeData = {
      labels: labels || [],
      personal: personalData || [],
      classAvg: classAvgData || []
    };

    // 仅保留 knowledge：每次 update 都刷新
    this._renderKnowledge();
  },

  // =========================
  // 内部工具
  // =========================
  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  _getKnowledgeData() {
    const kd = this.knowledgeData || {};

    // 1. 如果有真实数据传进来，就用真实的
    if (kd.labels && kd.labels.length > 0) {
      return {
        labels: kd.labels,
        personal: kd.personal || [],
        classAvg: kd.classAvg || []
      };
    }

    // 2. 如果没有数据，生成“默认 8 个 0”
    // 尝试从 main.js 定义的全局变量里获取 8 个知识点名称
    let defaultLabels = [];
    
    if (window.KNOWLEDGE_ORDER && window.KNOWLEDGE_MAP) {
       // 如果能读到全局配置，就用真实的知识点名字
       defaultLabels = window.KNOWLEDGE_ORDER.map(k => window.KNOWLEDGE_MAP[k] || k);
    } 
    // 生成对应长度的全 0 数组
    const zeros = new Array(defaultLabels.length).fill(0);

    return {
      labels: defaultLabels,
      personal: zeros, // [0, 0, 0, 0, 0, 0, 0, 0]
      classAvg: zeros  // [0, 0, 0, 0, 0, 0, 0, 0]
    };
  },

  _renderKnowledge() {
    if (!this.chart) {
      console.warn('[RadarModule] 图表尚未初始化，无法渲染');
      return;
    }

    const g = this.gradients || {};
    const { labels, personal, classAvg } = this._getKnowledgeData();

    this.chart.data.labels = labels;
    this.chart.data.datasets = [
      {
        label: '个人',
        data: personal,
        backgroundColor: g.personalFill || 'rgba(34, 211, 238, 0.18)',
        borderColor: g.personalBorder || '#22d3ee',
        borderWidth: 2.2,
        pointBackgroundColor: '#e0f2fe',
        pointBorderColor: '#22d3ee',
        order: 1
      },
      {
        label: '班级平均',
        data: classAvg,
        backgroundColor: 'transparent',
        borderColor: g.classBorder || 'rgba(148, 163, 184, 0.5)',
        borderWidth: 1.5,
        borderDash: [6, 6],
        pointBackgroundColor: 'rgba(148, 163, 184, 0.9)',
        pointRadius: 1.8,
        order: 2
      }
    ];

    this.chart.update();
  }
};
