CREATE DATABASE IF NOT EXISTS CatRescueDB
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE CatRescueDB;

-- 1. 人员
CREATE TABLE Person (
    person_id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(20),
    address VARCHAR(100)
);

-- 2. 志愿者（人员子类）
CREATE TABLE Volunteer (
    person_id INT PRIMARY KEY,
    join_date DATE,
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

-- 3. 领养人（人员子类）
CREATE TABLE Adopter (
    person_id INT PRIMARY KEY,
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

-- 4. 猫
CREATE TABLE Cat (
    cat_id INT PRIMARY KEY,
    name VARCHAR(50),
    color VARCHAR(30),
    age INT,
    current_status VARCHAR(30),
    health_status VARCHAR(30)
);

-- 5. 救助记录
CREATE TABLE RescueRecord (
    rescue_id INT PRIMARY KEY,
    rescue_date DATE,
    place VARCHAR(100),
    description VARCHAR(255),
    volunteer_id INT NOT NULL,
    cat_id INT NOT NULL,
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(person_id),
    FOREIGN KEY (cat_id) REFERENCES Cat(cat_id)
);

-- 6. 绝育记录
CREATE TABLE SterilizationRecord (
    ster_id INT PRIMARY KEY,
    ster_date DATE,
    hospital VARCHAR(100),
    recovery_status VARCHAR(30),
    remark VARCHAR(255),
    cat_id INT NOT NULL,
    FOREIGN KEY (cat_id) REFERENCES Cat(cat_id)
);

-- 7. 领养申请
CREATE TABLE AdoptionApplication (
    app_id INT PRIMARY KEY,
    apply_date DATE,
    review_date DATE,
    review_status VARCHAR(30),
    adopter_id INT NOT NULL,
    cat_id INT NOT NULL,
    FOREIGN KEY (adopter_id) REFERENCES Adopter(person_id),
    FOREIGN KEY (cat_id) REFERENCES Cat(cat_id)
);