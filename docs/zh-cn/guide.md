# 操作向导

## 1. 创建一个应用
---

Nebulajs Cloud是一个云应用平台，用户可以在平台托管多个应用。登录后在应用列表中创建一个应用，根据实际情况选择需要的功能模块。如：分布式文件存储（`Minio`）和工作流（`Camunda`）需要部署对应的第三方中间件。

* __文件存储__

  如需要使用文件上传、下载处理等功能请勾选此模块。

  > Minio分布式存储系统部署请参考 [https://min.io/](https://min.io/) 

* __工作流__

  如需要使用模型、自定义表单工作流审批等功能请勾选此模块。

  > Camunda7社区版工作流部署请参考 [https://docs.camunda.org/manual/7.23/installation/](https://docs.camunda.org/manual/7.23/installation/)

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1961748565483_.pic.jpg)

## 2. 创建一个模型
---

选择`模型`菜单，在模型列表中创建一个模型，并设置基本属性和字段。如果是现有的数据库表也可以选择`从数据库中导入`，导入时需要先把数据库信息填加到平台的外部中间件中。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1971748565532_.pic.jpg)
#### 2.1 基本信息

设置模型的名称、描述、权限、流程等信息。

* __软删除：__
  配置该模型删除时是否删除数据库中的记录。

* __发起流程：__
  配置该模型是否可绑定流程。

* __流程状态：__
  配置该模型用来存储流程状态的字段（`草稿`、`已提交`、`已完成`）。

* __数据权限：__
  配置该模型的数据可见性。

#### 2.2 模型属性

设置模型的字段信息，如：长度、类型、是否可查询等。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1981748565546_.pic.jpg)

* __可为空：__
  数据库和表单字段可为空，保存或更新时无需校验。

* __可更新：__
  更新表单保存时，字段是否需要更改。

* __可新增：__
  新增表单保存时，字段是否需要新增。

* __可查询：__
  是否生成列表上方的查询条件。

* __数据字典：__
  字段的值是否取自数据字典，填写数据字典的码值。选择后填写表单时该字段展示为下拉列表。


#### 2.3 模型关系

设置模型的关联关系。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1891748273871_.pic.jpg)

* __对应关系：__
  设置模型和其他模型的对应关系。（`一对一`，`多对一`，`多对多`）

* __源字段：__
  设置本模型的关联字段，此处一般为本模型对应表的主键。

* __目标模型：__
  选择要关联的模型。

* __目标字段：__
  设置要关联模型的字段，此处一般为表的外键。

* __更新：__
  设置级联更新动作。

* __删除：__
  设置级联删除动作。

#### 2.4 应用更改

将模型结构同步更改到数据库。（<b style='color:red'>此操作有数据丢失风险，应当避免在生产环境执行，执行前应当先备份好数据。</b>）

> 1. 应当避免在生产环境执行，其他环境需避开访问高峰期。
> 2. 该操作会锁定当前选中的表调整结构，锁表会造成该表无法访问
> 3. 该操作可能会导致数据库丢失数据，请提前做好备份。


## 3. 生成模型代码
---

在模型列表页面中，勾选想要生成的模型后进行代码生成，生成代码后可以在Web版的VSCODE中查看文件改动，代码存放目录为`/src`。

#### 3.1 功能选择
 * __列表__ ：模型数据列表，支持分页和条件查询
 * __新增__ ：模型新增功能，新增一条模型数据
 * __详情__ ：模型查看功能，查询一条模型数据
 * __更新__ ：模型更新功能，更新一条模型数据
 * __删除__ ：模型删除功能，删除一条模型数据
 * __导入__ ：Excel导入，选择文件导入模型数据。
 * __导出__ ：Excel导出，将模型数据导出为Excel。
  

生成实体类代码：`src/models/LeaveNote.ts`
<img src="https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1911748274649_.pic.jpg">

#### 3.2 生成接口

生成应用代码时，是否生成`RESTful API`中的接口，rest接口都会有`/rest`为前缀。如请假条接口：

 * __新增接口__ ：`PUT /rest/leave-note`
 * __修改接口__ ：`POST /rest/leave-note`
 * __删除接口__ ：`DELETE /rest/leave-note/:id`
 * __查询列表接口__ ：`GET /rest/leave-note`
 * __查询单条接口__ ：`GET /rest/leave-note/:id`

生成接口代码：`src/routers/rest/LeaveNoteRest.ts`
<img src="https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1901748274565_.pic.jpg">

  
#### 3.3 生成页面

生成应用代码时，是否根据模型字段生成增删查改页面。页面采用百度 [Amis](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index) 开发。
生成的页面可以在`页面`菜单中查看，点击`设计`按钮可以用`Amis在线编辑器`设计和调试页面。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1521747905876_.pic.jpg)

  Amis在线编辑器
![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1531747906033_.pic.jpg)

#### 3.4 生成菜单

  生成应用代码时，是否将本模块的页面自动挂载到系统菜单。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1991748565583_.pic.jpg)


## 4. 中间件管理
---

用户可以自行创建项目所依赖的中间件。选择`中间件`菜单可以查看当前所有的中间件信息（如：地址、端口、密钥等信息）。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F2031748570414_.pic.jpg)

创建每个中间件会对应一个`实例`，用户可以到实例页面查看对应的信息。目前支持的中间件如下：

* MySQL: MySQL数据库5.7版本
* SQLite: 本地数据库
* MongoDB: KV数据库
* Redis: 缓存中间件

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F2041748570428_.pic.jpg)

中间件分为`内部中间件`和`外部中间件`，内部中间件是指本平台通过`docker compose`创建的中间件实例，运行在本平台上。
外部中间件是指非本平台部署的中间件，用户可以通过创建`外部中间件`使其和应用去连接。

## 5. 应用配置
---

创建应用时会为应用生成`3`个配置文件，用户也可以自定义新增或删除配置文件。

 * `dev`: 开发环境；用于本地开发和调试
 * `uat`: 测试环境；用于应用测试
 * `prod`: 生产环境；正式上线用

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1551747906544_.pic.jpg)

每个配置文件分为`系统配置`和`业务配置`两个页签，用户可以修改配置，点击`更新配置`按钮后下发到应用，

 * __系统配置__ ：
   系统配置由左侧系统选项选择后生成，用户无法自行修改。
   
 * __业务配置__ ：
   业务配置用户可以自行修改，支持`YAML`格式。

<img style="border: 1px solid #ddd" src="https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1571747907402_.pic.jpg">

## 6. 启动开发工具
---

选择`开发`菜单，在右侧的vscode编辑器中启动在线编辑器（首次启动需要1-2分钟），启动成功后打开下面的`开发地址`，用户可进入在线开发VSCODE编辑器。如下图所示：

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot/1461747812169_.pic.jpg)

在线代码编辑器中点击左上角的菜单按钮选择`Terminal`，`New Terminal`，在控制台中可运行应用。

* __首次安装__

```shell
npm i
```

* __TypeScript编译监听__

如过使用typescript开发，则需要运行此命令。
```shell
npm run tsc
```

* __启动应用__

```shell
npm run dev
```

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot/1481747832488_.pic.jpg)

在控制台中打印出上图日志，则说明应用起动成功。


## 7. 访问应用
---

如图所示应用起动成功后，选择`开发`菜单，打开页面右侧的应用地址可以直接访问该应用。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1501747901234_.pic.jpg)

默认用户名和密码为：`admin` / `admin`

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1511747901261_.pic.jpg)

用户登入后点击菜单栏可进入相关的模块。

## 8. 打包和发布
---

选择`构建`菜单，列表中可以查看已经构建的历史软件版本（Docker镜像），以及版本描述说明。点击`开始构建`按钮也可以进行新版本构建。
删除`构建`时，同时也会删除docker镜像。

> 应用打包后为docker镜像，用户也可通过命令`docker images`查看镜像信息。<br>
如果打包操作比较频繁，用户需要定期清理不需要的镜像，以便磁盘空间占用太多。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1541747906231_.pic.jpg)

## 9. 实例管理
---

#### 9.1 实例管理

选择`实例`菜单，可以查看当前应用所有实例的运行状态、版本、地址和端口。点击`创建实例`可以创建新的应用实例，选择对应的配置和应用版本，每个环境只可以启动一个实例。
用户可以通过主机地址可以直接访问应用。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F2001748565621_.pic.jpg)

#### 9.1 实例详情

点击实例`详情`可以查看该应用实例的基本信息、日志等。

* __切换版本__

  当有新版本应用时，用户可以点击`切换版本`将当前实例切换到新版本。当新版本有重大问题时用户也可以通过此功能回退到上一个版本。

* __启动__ ：启动实例。

* __停止__ ：停止实例。


![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F2011748568604_.pic.jpg)

## 10. 任务调度
---

#### 10.1 创建任务

选择`任务`菜单，用户可以创建任务调度，通过编写`TypeScript`脚本实现定时任务的执行。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1701747980879_.pic.jpg)

* __运行周期__

  可以设置任务运行的周期，使用`CRON`表达式。

* __脚本路径__
  
  设置任务ts脚本的名称，创建调度任务后会在程序目录`src/jobs`下生成任务执行的ts脚本，可打开在线编辑进行开发。如下图所示

  <img src="https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1731747991365_.pic.jpg" width="550">

* __运行环境__

  设置任务运行的环境配置，选择环境后该环境会收到任务执行的消息广播。


#### 10.2 运行任务

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1721747991209_.pic.jpg)


* __运行__ ：单次运行任务。

* __启动__ ：启动任务调度，但不是立即执行。

* __停止__ ：停止任务调度。

* __结果__ ：查看任务执行结果，包括运行时间、状态、日志等。

