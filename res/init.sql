INSERT INTO cl_application (id,code,name,logo,client_id,client_secret,workflow,created_by,updated_by,remark,created_at,updated_at,status,base_port,storage_service,camunda_tenant_id,server_id) VALUES
	 ('nebula','nebula','nebula',NULL,'nebula-client-id','nebula-client-secret','camunda','admin','admin',NULL,'2022-12-08 15:22:04','2024-03-23 15:35:47','0','300','minio',NULL,'default');

INSERT INTO app_menu (id,pid,`group`,label,url,link,redirect,visible,is_system,icon,seq,created_by,updated_by,remark,app_id,created_at,updated_at) VALUES
	 ('323c80c1-995b-4568-815f-ac00496d4dfe','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'组织管理',NULL,NULL,NULL,1,1,NULL,NULL,'admin','admin',NULL,'nebula','2023-01-27 10:44:44','2023-04-02 21:15:15'),
	 ('4d29f83b-abf1-45b6-9985-14d9622d6b46','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'角色管理','/system/role',NULL,NULL,1,1,NULL,5,'admin','admin',NULL,'nebula','2023-01-27 22:49:28','2023-01-27 23:55:22'),
	 ('5bafb15b-5a0a-44fa-bfb5-31f1a12aede7','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'用户管理','/system/user',NULL,NULL,1,1,NULL,4,'admin','admin',NULL,'nebula','2021-12-12 13:53:58','2021-12-12 13:53:58'),
	 ('8744f6e8-8418-4e0e-b546-14265ce6c8b1','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'流程管理',NULL,NULL,NULL,1,1,NULL,NULL,'admin','admin',NULL,'nebula','2023-01-27 10:45:36','2023-03-20 21:59:23'),
	 ('87c09e5b-0299-4dd3-b2d0-4335b1e03c43','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'字典管理','/system/dict',NULL,NULL,1,1,NULL,NULL,'admin','admin',NULL,'nebula','2023-01-28 00:02:18','2023-01-28 00:02:33'),
	 ('b00d144b-ffd2-4c92-999b-02631d201153','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'菜单管理','/system/menu',NULL,NULL,1,1,NULL,1,'admin','admin',NULL,'nebula','2021-12-09 00:03:41','2023-04-12 22:13:12'),
--	 ('d6662d3c-8431-48fb-98c3-aca0fbacaae3','e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'文件管理','/system/file',NULL,NULL,1,1,NULL,NULL,'admin','admin','12334','nebula','2023-01-27 10:44:58','2023-05-14 00:18:43'),
	 ('143d2827-41c0-4fdb-8bf2-894dc9d459a3','8744f6e8-8418-4e0e-b546-14265ce6c8b1',NULL,'流程分组','/system/process-group',NULL,NULL,1,1,NULL,1,'admin','admin',NULL,'nebula','2023-03-20 22:13:28','2023-03-20 22:14:06'),
	 ('5c779ebc-2023-4a96-9c4e-0fd4ce12cdf4','8744f6e8-8418-4e0e-b546-14265ce6c8b1',NULL,'流程定义','/system/process-def',NULL,NULL,1,1,NULL,2,'admin','admin',NULL,'nebula','2023-03-20 21:53:57','2023-03-20 21:59:30'),
	 ('2bd0a499-93da-4406-8e5c-5f6f80de01fe','5c38a00b-c219-4b3b-bc9a-3dbc739962f4',NULL,'待我处理','/system/process-todo',NULL,NULL,1,1,NULL,2,'admin','admin',NULL,'nebula','2023-04-03 22:34:09','2023-04-03 22:38:50');
INSERT INTO app_menu (id,pid,`group`,label,url,link,redirect,visible,is_system,icon,seq,created_by,updated_by,remark,app_id,created_at,updated_at) VALUES
	 ('4a74465e-1dd4-40f7-889e-9cb547c3146d','5c38a00b-c219-4b3b-bc9a-3dbc739962f4',NULL,'发起流程','/system/process-index',NULL,NULL,1,1,NULL,1,'admin','admin',NULL,'nebula','2023-04-03 22:33:51','2023-04-03 22:38:40'),
	 ('c4062e96-2865-497f-b669-93a613aae139','5c38a00b-c219-4b3b-bc9a-3dbc739962f4',NULL,'已处理的','/system/process-done',NULL,NULL,1,1,NULL,3,'admin','admin',NULL,'nebula','2023-04-03 22:34:23','2023-04-03 22:38:55'),
	 ('dd0bca49-0886-402f-926c-00a1dd594762','5c38a00b-c219-4b3b-bc9a-3dbc739962f4',NULL,'我发起的','/system/process-mine',NULL,NULL,1,1,NULL,4,'admin','admin',NULL,'nebula','2023-04-03 22:34:36','2023-04-03 22:38:59'),
	 ('6e28ff15-a0ea-4dfe-af3a-5629564c0bdb','323c80c1-995b-4568-815f-ac00496d4dfe',NULL,'用户分配','/system/org/user-allocate',NULL,NULL,1,1,NULL,1,'admin','admin',NULL,'nebula','2023-04-02 21:00:13','2023-04-02 21:32:05'),
	 ('e1efb9d9-f01e-4025-b099-c24ed50ca697','323c80c1-995b-4568-815f-ac00496d4dfe',NULL,'组织管理','/system/org',NULL,NULL,1,1,NULL,2,'admin','admin',NULL,'nebula','2023-04-02 21:12:53','2023-04-02 21:15:32'),
	 ('3778fc96-f78c-4157-ab09-a9e069fb4a9e',NULL,NULL,'设置','/portal/setting',NULL,NULL,1,0,'nb-icon nb-icon-shezhixitongshezhigongnengshezhishuxing',10,NULL,NULL,NULL,'nebula','2022-12-26 15:02:38','2023-01-08 22:52:03'),
	 ('50c2e8d5-a1be-41f8-be2a-d5ccaa362a97',NULL,NULL,'模型','/portal/model',NULL,NULL,1,0,'nb-icon nb-icon-moxingguanli',1,NULL,NULL,NULL,'nebula','2022-12-21 18:03:24','2023-01-12 01:03:23'),
	 ('5c38a00b-c219-4b3b-bc9a-3dbc739962f4',NULL,'流程','协同办公',NULL,NULL,NULL,1,1,'nb-icon nb-icon-gongzuoliu1',98,NULL,NULL,NULL,'nebula','2023-04-03 22:33:37','2023-05-14 00:30:19'),
	 ('6063c3c9-b962-41bb-8e9f-80015cfeb4e1',NULL,NULL,'页面','/portal/page',NULL,NULL,1,0,'nb-icon nb-icon-biaodanyemian2',2,NULL,NULL,NULL,'nebula','2023-01-08 22:29:24','2023-01-08 22:51:40'),
	 ('9a5cc92e-8ca5-45f1-aa66-24ddb161be60',NULL,NULL,'中间件','/portal/middleware',NULL,NULL,1,0,'nb-icon nb-icon-pintu',9,NULL,NULL,NULL,'nebula','2022-12-21 23:11:55','2023-01-20 19:53:00');
INSERT INTO app_menu (id,pid,`group`,label,url,link,redirect,visible,is_system,icon,seq,created_by,updated_by,remark,app_id,created_at,updated_at) VALUES
	 ('a7f3a3de-4a12-4b9f-b5c0-e653b6f70f26',NULL,NULL,'实例','/portal/instance',NULL,NULL,1,0,'nb-icon nb-icon-PCfuwuqi',7,NULL,NULL,NULL,'nebula','2022-12-22 19:49:35','2023-01-16 20:42:33'),
	 ('ad8152fa-237b-4501-b961-67a0008bf49b',NULL,NULL,'接口','/portal/api',NULL,NULL,1,0,'nb-icon nb-icon-api',4,NULL,NULL,NULL,'nebula','2023-01-08 22:30:38','2023-01-20 19:36:13'),
	 ('c038e3eb-7a96-46cd-bd19-c8e8428e4ba0',NULL,NULL,'构建','/portal/build',NULL,NULL,1,0,'nb-icon nb-icon-shezhishedingpeizhibanshou',6,NULL,NULL,NULL,'nebula','2023-01-04 17:20:56','2023-01-16 20:42:27'),
	 ('d4ba73d7-7d41-466f-a656-ecc5d7f3e165',NULL,NULL,'开发','/portal/code',NULL,NULL,1,0,'nb-icon nb-icon-daima',5,NULL,NULL,NULL,'nebula','2023-01-16 20:36:47','2023-02-11 18:10:13'),
	 ('d695c7aa-b3ca-4d39-9628-119b3fadbdac',NULL,NULL,'数据集','/portal/dataset',NULL,NULL,1,0,'nb-icon nb-icon-SQLjiankong',3,NULL,NULL,NULL,'nebula','2023-01-16 20:37:10','2023-01-16 20:44:55'),
	 ('e20346a7-1b7a-437f-b668-2f33083c03b8',NULL,'系统','系统管理',NULL,NULL,NULL,1,1,'nb-icon nb-icon-xitongguanli',99,NULL,NULL,NULL,'nebula','2021-12-09 00:02:44','2023-04-12 22:13:19'),
	 ('edbf0832-9634-4208-bea1-cbf6b3a5ba92',NULL,NULL,'任务','/portal/job',NULL,NULL,1,0,'nb-icon nb-icon-renwuguanli',4,NULL,NULL,NULL,'nebula','2024-04-06 23:46:15','2024-04-06 23:54:14'),
	 ('ee1e4ab1-013d-4845-9a5f-f335b1869214',NULL,NULL,'配置','/portal/config',NULL,NULL,1,0,'nb-icon nb-icon-shujupeizhi',8,NULL,NULL,NULL,'nebula','2023-01-20 19:34:09','2023-01-20 19:53:06');

INSERT INTO cl_page (id,name,version,url,`schema`,schema_file,is_internal,is_system,created_by,updated_by,remark,app_id,created_at,updated_at,locked_by,menu_id) VALUES
	 ('3133bc66-bb4d-4ca6-992d-ef1b7d03d7a9','主页','20221221180221','/portal/apps',NULL,'portal/index.json',1,0,NULL,NULL,NULL,'nebula','2022-11-05 00:02:03','2022-12-21 18:02:21',NULL,NULL),
	 ('40871dc5-a23f-4e3d-8bc3-f34df798b28d','登陆页',NULL,'/portal/login',NULL,'portal/login.json',1,0,NULL,NULL,NULL,'nebula','2022-11-05 00:03:09','2022-11-05 00:03:09',NULL,NULL),
	 ('84c794e7-d184-42a5-ae8e-09793ee7bdae','控制台','20221220005429','/portal/console',NULL,'portal/console.json',1,0,NULL,NULL,NULL,'nebula','2022-11-05 00:02:57','2022-12-20 00:54:30',NULL,NULL),
	 ('63883897-81a4-4192-bf8a-c5ea3dfb60f7','PTL-构建页',NULL,'/portal/build',NULL,'portal/build.json',1,0,NULL,NULL,NULL,'nebula','2023-01-04 17:22:30','2023-01-04 17:22:30',NULL,NULL),
	 ('681abf7f-3284-4383-9848-64ab0eef25f7','PTL-接口页',NULL,'/portal/api',NULL,'portal/api.json',1,0,NULL,NULL,NULL,'nebula','2023-01-08 22:46:12','2023-01-08 22:46:12',NULL,NULL),
	 ('7a991b69-3b84-4dd1-8d95-b205db559707','PTL-页面管理页',NULL,'/portal/page',NULL,'portal/page.json',1,0,NULL,NULL,NULL,'nebula','2021-12-09 00:15:40','2021-12-09 00:15:40',NULL,NULL),
	 ('964c29ab-42e1-4088-9c7e-8af8ffc04f10','PTL-应用设置',NULL,'/portal/setting',NULL,'portal/setting.json',1,0,NULL,NULL,NULL,'nebula','2022-12-22 21:42:42','2022-12-22 21:42:42',NULL,NULL),
	 ('0af8ce31-7129-45b1-9554-fa0baaeae00c','PTL-实例页',NULL,'/portal/instance',NULL,'portal/instance.json',1,0,NULL,NULL,NULL,'nebula','2022-12-22 19:50:45','2022-12-22 19:50:45',NULL,NULL),
     ('1ae907b4-dde8-4fe3-9fc1-493730b40f03','PTL-登陆授权',NULL,'/portal/authorize',NULL,'portal/authorize.json',1,0,NULL,NULL,NULL,'nebula','2023-02-13 13:20:12','2023-02-13 13:20:12',NULL,NULL),
     ('2cea8bec-065d-4b5f-876b-a9a9e18da284','PTL-数据模型','20221221181305','/portal/model',NULL,'portal/model.json',1,0,NULL,NULL,NULL,'nebula','2022-12-21 18:06:45','2022-12-21 18:13:05',NULL,NULL),
     ('2ef30c76-d73d-48f9-9be5-a831009e4b79','PTL-代码页',NULL,'/portal/code',NULL,'portal/code.json',1,0,NULL,NULL,NULL,'nebula','2023-01-16 20:37:39','2023-01-16 20:37:39',NULL,NULL),
     ('31caf9d3-db86-4fbe-b147-492bf478ff8c','PTL-配置页','20230120195718','/portal/config',NULL,'portal/config.json',1,0,NULL,NULL,NULL,'nebula','2023-01-20 19:53:56','2023-01-20 19:57:18',NULL,NULL),
	 ('b65cc392-e06c-4a2c-904a-632ebff8f985','PTL-数据集',NULL,'/portal/dataset',NULL,'portal/dataset.json',1,0,NULL,NULL,NULL,'nebula','2023-01-16 20:38:46','2023-01-16 20:38:46',NULL,NULL),
	 ('b9e61535-2798-4448-9d61-73b05d2f3002','PTL-任务执行页',NULL,'/portal/job-execution',NULL,'portal/job-execution.json',1,0,NULL,NULL,NULL,'nebula','2024-04-11 19:33:37','2024-04-11 19:33:37',NULL,NULL),
	 ('c2e70831-8c24-4e6b-a3ab-84f9b7635099','PTL-模型编辑',NULL,'/portal/model-edit',NULL,'portal/model-edit.json',1,0,NULL,NULL,NULL,'nebula','2022-12-28 18:31:01','2022-12-28 18:47:48',NULL,NULL),
	 ('cbda84cc-5bb8-404c-b3b3-91cf92ba8c6a','PTL-中间件','20221221231724','/portal/middleware',NULL,'portal/middleware.json',1,0,NULL,NULL,NULL,'nebula','2022-12-21 23:11:34','2022-12-21 23:17:24',NULL,NULL),
	 ('cd29bb94-0221-4528-86fa-f0bf0beae3a3','PTL-任务页',NULL,'/portal/job',NULL,'portal/job.json',1,0,NULL,NULL,NULL,'nebula','2024-04-06 23:55:42','2024-04-06 23:55:42',NULL,NULL),
	 ('f5657099-7654-4401-8ccc-b120e5bf352d','PTL-实例详情',NULL,'/portal/instance-info',NULL,'portal/instance-info.json',1,0,'admin','admin',NULL,'nebula','2023-01-09 21:07:17','2024-11-25 19:52:59',NULL,NULL);
INSERT INTO cl_page (id,name,version,url,`schema`,schema_file,is_internal,is_system,created_by,updated_by,remark,app_id,created_at,updated_at,locked_by,menu_id) VALUES
     ('75ba88f8-0ea4-43e3-b373-504019f1c267','【流程】发起流程',NULL,'/system/process-index',NULL,'app/process-index.json',1,1,'admin','admin',NULL,'nebula','2023-04-03 22:30:06','2023-04-03 22:30:06',NULL,NULL),
	 ('844a54db-1084-4c2e-bfa1-1c34f9b0b2cb','【流程】流程详情',NULL,'/system/process-detail',NULL,'app/process-detail.json',1,1,'admin','admin',NULL,'nebula','2023-04-25 20:33:29','2023-04-25 20:33:29',NULL,NULL),
	 ('19fbbd1a-9ebc-42d2-b049-b24d91e104ae','【流程】待我处理',NULL,'/system/process-todo',NULL,'app/process-todo.json',1,1,'admin','admin',NULL,'nebula','2023-01-27 23:48:29','2023-01-27 23:49:27',NULL,NULL),
	 ('bbcac5dd-57da-44f6-8798-1764da7c81ea','【流程】已处理的',NULL,'/system/process-done',NULL,'app/process-done.json',1,1,'admin','admin',NULL,'nebula','2023-04-03 22:27:45','2023-04-03 22:27:45',NULL,NULL),
	 ('d5800817-c3ca-449d-99b4-1ad7af8c7011','【流程】我发起的',NULL,'/system/process-mine',NULL,'app/process-mine.json',1,1,'admin','admin',NULL,'nebula','2023-04-03 22:29:10','2023-04-03 22:29:10',NULL,NULL),
	 ('dcf43f45-cae9-48f6-8d32-9ba67de3a0a4','【系统】流程分组',NULL,'/system/process-group',NULL,'app/process-group.json',1,1,'admin','admin',NULL,'nebula','2023-03-20 22:10:42','2023-03-20 22:10:42',NULL,NULL),
	 ('3e2d15cf-f562-4e68-a410-815a3267905a','【系统】流程定义',NULL,'/system/process-def',NULL,'app/process-def.json',1,1,'admin','admin',NULL,'nebula','2023-03-20 21:59:00','2023-03-20 22:02:25',NULL,NULL),
     ('2f62c59a-0581-4ddd-9702-910e3e025920','【系统】菜单页',NULL,'/system/menu',NULL,'app/menu.json',1,1,NULL,NULL,NULL,'nebula','2021-12-09 00:15:48','2021-12-09 00:15:48',NULL,NULL),
	 ('811468cd-170d-4ff2-b1b0-1b5c59fe038f','【系统】字典管理',NULL,'/system/dict',NULL,'app/dict.json',1,1,NULL,NULL,NULL,'nebula','2021-12-09 00:15:48','2021-12-09 00:15:48',NULL,NULL),
--	 ('07394159-f51b-4566-b2c8-ee37b602fe1e','【系统】文件管理',NULL,'/system/file',NULL,'app/file.json',1,1,NULL,NULL,NULL,'nebula','2023-01-27 23:50:57','2023-01-27 23:50:57',NULL,NULL),
     ('0d9988aa-427d-4853-97aa-c699ce46c19c','【系统】用户管理',NULL,'/system/user',NULL,'app/user.json',1,1,NULL,NULL,NULL,'nebula','2023-01-27 22:51:00','2023-01-27 22:51:00',NULL,'5bafb15b-5a0a-44fa-bfb5-31f1a12aede7'),
	 ('d49358d3-9cba-4c35-810f-474d47cd27e2','【系统】角色管理',NULL,'/system/role',NULL,'app/role.json',1,1,NULL,NULL,NULL,'nebula','2023-01-27 23:50:24','2023-01-27 23:50:24',NULL,NULL),
	 ('fdd2b33e-5644-45d3-888b-fcfb6a01daa3','【系统】组织用户分配',NULL,'/system/org/user-allocate',NULL,'app/org-user.json',1,1,'admin','admin',NULL,'nebula','2023-04-02 21:16:42','2023-04-02 21:16:42',NULL,NULL),
	 ('ffea9eac-8857-456d-bffc-7befcaa8d796','【系统】组织管理',NULL,'/system/org',NULL,'app/org.json',1,1,NULL,NULL,NULL,'nebula','2023-01-27 23:50:01','2023-01-27 23:50:01',NULL,NULL);

INSERT INTO app_user (id,login,name,password,`position`,avatar,email,mobile,created_by,updated_by,remark,app_id,created_at,updated_at,dept_id,dept_name,last_login_date,last_login_ip,status) VALUES
	 ('ddd91cf5-354c-4dec-81d4-4c2cde4d0b1b','admin','管理员','$2b$10$2sY.m8X39VrNvsUQXXUXS.gbVVtFBehAUPBbkapgeEecVYteftl9m',NULL,NULL,'admin@nebulajs.com',NULL,'admin','admin',NULL,'nebula','2023-02-15 20:56:09','2024-12-06 17:10:04',NULL,NULL,NULL,NULL,'1');

INSERT INTO app_role (id,name,created_by,updated_by,remark,app_id,created_at,updated_at,status,code) VALUES
	 ('9543d5c4-e050-44b2-9a55-d6dc2abde433','管理角色','admin','admin',NULL,'nebula','2023-05-13 23:51:47','2023-05-13 23:51:47','1','ROLE_ADMIN');

INSERT INTO app_user_role (id,user_id,role_id) VALUES
     ('fff4816e-15dc-493d-a75d-597f774129f3','ddd91cf5-354c-4dec-81d4-4c2cde4d0b1b','9543d5c4-e050-44b2-9a55-d6dc2abde433');

