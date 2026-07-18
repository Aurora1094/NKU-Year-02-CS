/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     2026/4/11 12:20:47                           */
/*==============================================================*/


drop table if exists Adopter;

drop table if exists AdoptionApplication;

drop table if exists Cat;

drop table if exists Person;

drop table if exists RescueRecord;

drop table if exists SterilizationRecord;

drop table if exists Volunteer;

/*==============================================================*/
/* Table: Adopter                                               */
/*==============================================================*/
create table Adopter
(
   person_id            INT not null,
   primary key (person_id)
);

/*==============================================================*/
/* Table: AdoptionApplication                                   */
/*==============================================================*/
create table AdoptionApplication
(
   app_id               INT not null,
   cat_id               INT not null,
   adopter_id           INT not null,
   apply_date           DATE,
   review_date          DATE,
   review_status        VARCHAR(30),
   primary key (app_id)
);

/*==============================================================*/
/* Table: Cat                                                   */
/*==============================================================*/
create table Cat
(
   cat_id               INT not null,
   name                 VARCHAR(50),
   color                VARCHAR(30),
   age                  INT,
   current_status       VARCHAR(30),
   health_status        VARCHAR(30),
   primary key (cat_id)
);

/*==============================================================*/
/* Table: Person                                                */
/*==============================================================*/
create table Person
(
   person_id            INT not null,
   name                 VARCHAR(50),
   gender               VARCHAR(10),
   phone                VARCHAR(20),
   address              VARCHAR(100),
   primary key (person_id)
);

/*==============================================================*/
/* Table: RescueRecord                                          */
/*==============================================================*/
create table RescueRecord
(
   rescue_id            INT not null,
   cat_id               INT not null,
   volunteer_id         INT not null,
   rescue_date          DATE,
   place                VARCHAR(100),
   description          VARCHAR(255),
   primary key (rescue_id)
);

/*==============================================================*/
/* Table: SterilizationRecord                                   */
/*==============================================================*/
create table SterilizationRecord
(
   ster_id              INT not null,
   cat_id               INT,
   ster_date            DATE,
   hospital             VARCHAR(100),
   recovery_status      VARCHAR(30),
   remark               VARCHAR(255),
   primary key (ster_id)
);

/*==============================================================*/
/* Table: Volunteer                                             */
/*==============================================================*/
create table Volunteer
(
   person_id            INT not null,
   join_date            DATE,
   primary key (person_id)
);

alter table Adopter add constraint FK_Inheritance_2 foreign key (person_id)
      references Person (person_id) on delete restrict on update restrict;

alter table AdoptionApplication add constraint FK_被申请领养 foreign key (cat_id)
      references Cat (cat_id) on delete restrict on update restrict;

alter table AdoptionApplication add constraint FK_领养 foreign key (adopter_id)
      references Adopter (person_id) on delete restrict on update restrict;

alter table RescueRecord add constraint FK_救助 foreign key (volunteer_id)
      references Volunteer (person_id) on delete restrict on update restrict;

alter table RescueRecord add constraint FK_被救助 foreign key (cat_id)
      references Cat (cat_id) on delete restrict on update restrict;

alter table SterilizationRecord add constraint FK_Reference_7 foreign key (cat_id)
      references Cat (cat_id) on delete restrict on update restrict;

alter table Volunteer add constraint FK_Inheritance_1 foreign key (person_id)
      references Person (person_id) on delete restrict on update restrict;

