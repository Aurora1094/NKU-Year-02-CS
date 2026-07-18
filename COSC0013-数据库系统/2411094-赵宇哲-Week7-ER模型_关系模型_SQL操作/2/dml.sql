-- 单表查询
-- 查询所有当前状态为“待领养”的猫的信息
SELECT cat_id, name, color, age, current_status, health_status
FROM Cat
WHERE current_status = '待领养';

-- 多表连接查询
-- 查询每条救助记录对应的志愿者编号、猫编号、救助日期和地点
SELECT r.rescue_id, r.rescue_date, r.place, r.volunteer_id, r.cat_id
FROM RescueRecord r
JOIN Volunteer v ON r.volunteer_id = v.person_id
JOIN Cat c ON r.cat_id = c.cat_id;

-- 多表嵌套查询
-- 查询申请领养编号为 1001 的猫的所有领养人编号。
SELECT person_id
FROM Adopter
WHERE person_id IN (
    SELECT adopter_id
    FROM AdoptionApplication
    WHERE cat_id = 1001
);

-- EXISTS 查询
-- 查询至少被申请领养过一次的猫的信息。
SELECT c.cat_id, c.name, c.color
FROM Cat c
WHERE EXISTS (
    SELECT *
    FROM AdoptionApplication a
    WHERE a.cat_id = c.cat_id
);

-- 聚合操作查询
-- 统计每只猫收到的领养申请数量。
SELECT cat_id, COUNT(*) AS application_count
FROM AdoptionApplication
GROUP BY cat_id;