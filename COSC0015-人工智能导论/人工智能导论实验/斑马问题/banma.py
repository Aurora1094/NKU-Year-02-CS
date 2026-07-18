from kanren import run, eq, membero, var, conde        # kanren一个描述性Python逻辑编程系统
from kanren.core import lall                           # lall包用于定义规则
import time

def left(x, y, units):
    return membero((x, y), zip(units, units[1:]))

def right(x, y, units):
    return left(y, x, units)

def next(x, y, units):
    return conde([left(x, y, units)], [right(x, y, units)])

class Agent:
    """
    推理智能体.
    """
    def __init__(self):
        """
        智能体初始化.
        """
        self.units = var()
        self.rules_zebraproblem = None
        self.solutions = None

    def define_rules(self):
        """
        定义逻辑规则.
        """
        h1, h2, h3, h4, h5 = var(), var(), var(), var(), var()
        units_tuple = (h1, h2, h3, h4, h5)
        # self.units共包含五个unit成员，即每一个unit对应的var都指代一座房子(国家，工作，饮料，宠物，颜色)
        # 各个unit房子又包含五个成员属性: (国家，工作，饮料，宠物，颜色)

        self.rules_zebraproblem = lall(
            # 绑定房子集合
            eq(self.units, units_tuple),

            # 国家与颜色
            membero(('英国人', var(), var(), var(), '红色'), units_tuple),
            # 国家与宠物
            membero(('西班牙人', var(), var(), '狗', var()), units_tuple),
            # 国家与职业
            membero(('日本人', '油漆工', var(), var(), var()), units_tuple),
            # 国家与饮料
            membero(('意大利人', var(), '茶', var(), var()), units_tuple),

            # 第一座房子是挪威人
            eq(h1, ('挪威人', var(), var(), var(), var())),

            # 颜色位置关系：绿色在白色左边（不一定相邻）
            conde([left((var(), var(), var(), var(), '绿色'),
                        (var(), var(), var(), var(), '白色'), units_tuple)],
                  [eq((var(), var(), var(), var(), '绿色'), h3),
                   eq((var(), var(), var(), var(), '白色'), h4)],
                  [eq((var(), var(), var(), var(), '绿色'), h4),
                   eq((var(), var(), var(), var(), '白色'), h5)]),

            # 挪威人旁边是蓝色房子（h1旁边只能是h2）
            eq(h2, (var(), var(), var(), var(), '蓝色')),

            # 职业、宠物、饮料约束
            membero((var(), '摄影师', var(), '蜗牛', var()), units_tuple),
            membero((var(), '外交官', var(), var(), '黄色'), units_tuple),
            membero((var(), '小提琴家', '橘子汁', var(), var()), units_tuple),

            # 中间房子（h3）喝牛奶
            eq(h3, (var(), var(), '牛奶', var(), var())),
            # 绿色房子喝咖啡
            membero((var(), var(), '咖啡', var(), '绿色'), units_tuple),
            # 存在喝矿泉水的人
            membero((var(), var(), '矿泉水', var(), var()), units_tuple),

            # 存在斑马和马
            membero((var(), var(), var(), '斑马', var()), units_tuple),
            membero((var(), var(), var(), '马', var()), units_tuple),

            # 相邻关系
            next((var(), '医生', var(), var(), var()),
                 (var(), var(), var(), '狐狸', var()), units_tuple),
            next((var(), '外交官', var(), var(), var()),
                 (var(), var(), var(), '马', var()), units_tuple),
        )

    def solve(self):
        """
        规则求解器(请勿修改此函数).
        return: 斑马规则求解器给出的答案，共包含五条匹配信息，解唯一.
        """

        self.define_rules()
        self.solutions = run(0, self.units, self.rules_zebraproblem)
        return self.solutions

agent = Agent()
solutions = agent.solve()

# 提取解释器的输出
output = [house for house in solutions[0] if '斑马' in house][0][4]
print ('\n{}房子里的人养斑马'.format(output))
output = [house for house in solutions[0] if '矿泉水' in house][0][4]
print ('{}房子里的人喜欢喝矿泉水'.format(output))

# 解释器的输出结果展示
for i in solutions[0]:
    print(i)
