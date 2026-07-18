/**
 * 文件路径: ChinaVis/vis/3/main.js
 * 作用：主程序逻辑：页面绘制 / 数据加载 / 下拉联动
 *       图表绘制只调用 radar.js 中的 RadarModule
 */

// 作为 ES 模块，从同目录导入 RadarModule
import { RadarModule } from './radar.js';

// 全局状态：只保留与学生/班级有关的信息
const AppState = {
    allStudents: [],
    classMap: {}
};

/**
 * 知识点编码映射（供界面和 DataLoader 使用）
 * 原本在 radar.js 中，这里挪到 main.js，方便统一管理
 */
// ① 固定 8 个知识点的顺序（雷达轴顺序就按这个来）
window.KNOWLEDGE_ORDER = [
  't5V9e',
  'm3D1v',
  'g7R2j',
  'y9W5d',
  'b3C9s',
  'r8S3g',
  's8Y2f', // ← 改成第7个真实知识点编码
  'k4W1c'  // ← 改成第8个真实知识点编码
];

// ② 显示名映射（你现在是 code->code，也可以改成中文名）
window.KNOWLEDGE_MAP = {
  t5V9e: 't5V9e',
  m3D1v: 'm3D1v',
  g7R2j: 'g7R2j',
  y9W5d: 'y9W5d',
  b3C9s: 'b3C9s',
  r8S3g: 'r8S3g',
  s8Y2f: 's8Y2f', // ← 同上，替换
  k4W1c: 'k4W1c'
};

/**
 * DataLoader
 * 负责从 CSV 中解析学生数据（原来在 radar.js 中）
 */
window.DataLoader = {
    // 既然你确认文件就在这，我们就只读这个，不乱找了
    csvPath: './data/new_data.csv',

    async init() {
        try {
            console.log(`[DataLoader] 正在读取: ${this.csvPath}`);
            const response = await fetch(this.csvPath);

            if (!response.ok) {
                // 如果 assets/data.csv 真的读取失败（404），再试一下根目录
                console.warn("assets下未找到，尝试根目录...");
                const res2 = await fetch('./data.csv');
                if (!res2.ok) throw new Error("文件未找到");
                return this.processCSV(await res2.text());
            }

            // 正常读取
            const csvText = await response.text();
            return this.processCSV(csvText);

        } 
        catch (error) {
            console.error('[DataLoader] 数据加载严重错误:', error);
            
            // 1. (可选) 弹窗提示用户，但不再说“显示模拟数据”
            alert("数据文件读取失败，无法加载图表。");

            // 2. 关键修改：直接返回 null，不再调用 getFallbackData()
            //    return this.getFallbackData();  <-- 删除这行
            return null;
        }
    },

    processCSV(csvText) {
        const lines = csvText.split('\n');
        // 跳过第一行表头
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');
        const studentsMap = {};

        dataRows.forEach(line => {
            const cols = line.split(',');
            // 只要列数够7列，我就认为它是对的，不管里面是不是乱码
            if (cols.length < 7) return;

            // 根据你的截图:
            // col[0]=序号, col[1]=班级, col[2]=ID, col[3]=知识点, col[6]=分数
            const clazz = cols[1].trim();
            const sid = cols[2].trim();
            const kpCode = cols[3].trim();
            const mastery = parseFloat(cols[6]);

            // 过滤掉无效数据
            if (!sid || !kpCode || isNaN(mastery)) return;

            if (!studentsMap[sid]) {
                studentsMap[sid] = {
                    id: sid,
                    class: clazz,
                    name: `${sid}`, 
                    rawScores: {}
                };
            }
            if (!studentsMap[sid].rawScores[kpCode]) {
                studentsMap[sid].rawScores[kpCode] = [];
            }
            studentsMap[sid].rawScores[kpCode].push(mastery);
        });

        // 聚合数据
        const studentsList = Object.values(studentsMap).map(s => {
            const finalScores = [];
            let totalScore = 0;
            let count = 0;
            for (const [kp, scores] of Object.entries(s.rawScores)) {
                const kpAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
                finalScores.push({ kp: kp, val: kpAvg });
                totalScore += kpAvg;
                count++;
            }
            return {
                id: s.id,
                name: s.name,
                class: s.class,
                scores: finalScores,
                overallAvg: count > 0 ? totalScore / count : 0
            };
        });

        // 按平均分排序
        // studentsList.sort((a, b) => b.overallAvg - a.overallAvg);

        console.log(`[DataLoader] 解析成功，加载了 ${studentsList.length} 名学生`);
        return { students: studentsList };
    },

    // 最后的兜底，万一文件真丢了
    getFallbackData() {
        const mockStudents = [];
        for (let c = 1; c <= 3; c++) {
            for (let s = 1; s <= 5; s++) {
                const sid = `Mock_${c}_${s}`;
                mockStudents.push({
                    id: sid,
                    name: sid,
                    class: `Class${c}`,
                    scores: Object.keys(KNOWLEDGE_MAP)
                        .map(k => ({ kp: k, val: Math.random() })),
                    overallAvg: Math.random()
                });
            }
        }
        return { students: mockStudents };
    }
};


function clearDashboard() {
  console.log('[main.js] studentSelector 为空/无效 -> 清空绘图');

  // 学生画像两张图：你已经实现了 clear()
  if (window.StudentProfile && typeof window.StudentProfile.clear === 'function') {
    window.StudentProfile.clear();
  }
}




/**
 * 设置“班级 -> 学生”级联下拉
 * 修改：不再填充 options，仅保留数据处理和必要的监听
 */
function setupCascadeLogic(students) {
    // 1. 【保留】数据映射逻辑，因为 updateDashboard 仍然需要用到 AppState.classMap
    const classMap = {};
    students.forEach(s => {
        if (!classMap[s.class]) classMap[s.class] = [];
        classMap[s.class].push(s);
    });
    AppState.classMap = classMap;

    // 2. 获取 DOM 元素
    const classSelect = document.getElementById('classSelector');
    const studentSelect = document.getElementById('studentSelector');
    if (!classSelect || !studentSelect) return;

    // ============================================================
    // 【注释掉】下面的代码，防止覆盖你在其他 JS 文件中填充的内容
    // ============================================================

    /* // 按班级编号排序
    const classNames = Object.keys(classMap).sort(
        (a, b) =>
            (parseInt(a.replace(/\D/g, ''), 10) || 0) -
            (parseInt(b.replace(/\D/g, ''), 10) || 0)
    );

    // 填充班级列表
    classSelect.innerHTML = '';

    // ① 先插入一个“全部/请选择班级”的 option
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = '请选择班级';
    optAll.selected = true;
    classSelect.appendChild(optAll);

    classNames.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.innerText = cls;
        classSelect.appendChild(opt);
    });

    // 班级变化 -> 填充学生列表并选中第一个
    classSelect.addEventListener('change', () => {
        const selectedClass = classSelect.value;
        // ... (省略的原有级联逻辑) ...
        // 如果你的另一个JS文件处理了级联逻辑，这里必须注释掉，否则会冲突
    });
    */

    // ============================================================
    // 【保留】监听逻辑
    // ============================================================
    
    // 既然你在其他 JS 里填充了下拉框，
    // 请确保那个 JS 里生成的 <option value="..."> 的 value 是学生的 student_ID
    // 这样这里监听到 change 后，才能正确调用 updateDashboard
    studentSelect.addEventListener('change', () => {
        // 当你在其他 JS 填充的下拉框发生变化时，这里负责刷新雷达图
        updateDashboard(studentSelect.value);
    });


      // ✅ 监听 studentSelector 的 option 变化（清空/重建通常不会触发 change）
  const obs = new MutationObserver(() => {
    const hasOptions = studentSelect.options && studentSelect.options.length > 0;
    const currentId = studentSelect.value;

    // 只要：没选项 OR value 为空 OR value 找不到学生 -> 清空
    const exists = AppState.allStudents.some(s => s.id === currentId);
    if (!hasOptions || !currentId || !exists) {
      clearDashboard();
    }
  });

  obs.observe(studentSelect, { childList: true, subtree: true });

  // ✅ 页面初始化时也先清一下，避免残留
  clearDashboard();

}

/**
 * 根据当前选中的学生刷新“知识点掌握度”雷达图
 */
/**
 * 根据当前选中的学生刷新“知识点掌握度”雷达图
 * 修改：当未选中有效学生（如选择“请选择学生”）时，将雷达图重置为 0
 */
function updateDashboard(studentId) {
    if (!studentId) {
    clearDashboard();
    return;
  }



    const student = AppState.allStudents.find(s => s.id === studentId);

    // ============================================================
    // 【修改点】如果找不到学生（id为空 或 id不存在），则重置图表为0
    // ============================================================
    if (!student) {
        console.log('[main.js] 未选中有效学生，雷达图归零');
        
        // 1. 准备标签
        const labels = window.KNOWLEDGE_ORDER.map(kp => window.KNOWLEDGE_MAP[kp] || kp);
        
        // 2. 准备全0数据
        const zeroData = window.KNOWLEDGE_ORDER.map(() => 0);

        // 3. 更新图表
        if (typeof RadarModule.update === 'function') {
            // 个人数据、班级平均数据都设为 0
            RadarModule.update(labels, zeroData, zeroData);
        }
        // 学生画像图也需要清空，避免残留上一次的内容
        if (window.StudentProfile && typeof window.StudentProfile.clear === 'function') {
            window.StudentProfile.clear();
        }
        return; // 结束函数
    }

    // ============================================================
    // 下面是原有的正常逻辑（保持不变）
    // ============================================================

    // 当前班级学生列表
    const classStudents = AppState.classMap[student.class] || [];

    // 计算每个知识点在班级内的平均值（0~100）
    // 把该学生的分数做成 Map，方便按 kp 查
    const studentScoreMap = {};
    student.scores.forEach(({ kp, val }) => {
        studentScoreMap[kp] = val; // 0~1
    });

    // 计算班级平均：对每个 kp 分别求平均（只算有这个 kp 的人）
    const sumMap = {};
    const cntMap = {};
    window.KNOWLEDGE_ORDER.forEach(kp => {
        sumMap[kp] = 0;
        cntMap[kp] = 0;
    });

    classStudents.forEach(s => {
        const m = {};
        s.scores.forEach(({ kp, val }) => { m[kp] = val; });
        window.KNOWLEDGE_ORDER.forEach(kp => {
            if (m[kp] !== undefined) {
                sumMap[kp] += m[kp];
                cntMap[kp] += 1;
            }
        });
    });

    // 构造雷达图三组数据（0~100）
    const labels = window.KNOWLEDGE_ORDER.map(kp => window.KNOWLEDGE_MAP[kp] || kp);

    const personalData = window.KNOWLEDGE_ORDER.map(kp => {
        const v01 = (studentScoreMap[kp] !== undefined) ? studentScoreMap[kp] : 0;
        return Number((v01 * 100).toFixed(1));
    });

    const classAvgData = window.KNOWLEDGE_ORDER.map(kp => {
        const avg01 = cntMap[kp] > 0 ? (sumMap[kp] / cntMap[kp]) : 0;
        return Number((avg01 * 100).toFixed(1));
    });

    // 刷新雷达图
    if (typeof RadarModule.update === 'function') {
        RadarModule.update(labels, personalData, classAvgData);
    }

    // 同时刷新 student-profile.js 那两个图
    if (window.StudentProfile && typeof window.StudentProfile.updateFromStudentId === 'function') {
        window.StudentProfile.updateFromStudentId(studentId);
    }
}
/**
 * 页面入口：初始化雷达图、加载数据、刷新时间
 */
async function initApp() {
    // 1. 初始化雷达图（空图）
    if (RadarModule && typeof RadarModule.init === 'function') {
        RadarModule.init('radarChart');
    } else {
        console.warn('[main.js] RadarModule 未加载或未实现 init()');
    }

    // 2. 加载数据并初始化班级/学生下拉
    const data = await DataLoader.init();
    if (data && data.students && data.students.length > 0) {
        AppState.allStudents = data.students;
        setupCascadeLogic(data.students);
    }

    // 3. 顶部当前时间（保持不变）
    setInterval(() => {
        const timeEl = document.getElementById('current-time');
        if (timeEl) {
            timeEl.innerText = new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }, 1000);

    
}

window.addEventListener('DOMContentLoaded', initApp);
