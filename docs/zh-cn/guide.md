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

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot/1211747538227_.pic.jpg)

## 2. 创建一个模型
---

选择`模型`菜单，在模型列表中创建一个模型，并设置基本属性和字段。如果是现有的数据库表也可以选择`从数据库中导入`，导入时需要先把数据库信息填加到平台的外部中间件中。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1181747479467_.pic.jpg)

设置模型字段的名称、类型等。

* __可为空：__
  数据库和表单字段可为空，保存或更新时无需校验。

* __可更新：__
  更新表单保存时，字段是否需要更改和显示。

* __可新增：__
  新增表单保存时，字段是否需要更改和显示。

* __可查询：__
  是否生成列表上方的查询条件。

* __数据字典：__
  字段的值是否取自数据字典，填写数据字典的码值。选择后填写表单时该字段展示为下拉列表。
  
* __发起流程：__
  配置该表单是否可绑定流程。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1191747480447_.pic.jpg)


## 3. 生成模型代码
---

在模型列表页面中，勾选想要生成的模型后进行代码生成，生成代码后可以在Web版的VSCODE中查看文件改动。

* __功能选择__
  * __列表__ ：模型数据列表，支持分页和条件查询
  * __新增__ ：模型新增功能，新增一条模型数据
  * __详情__ ：模型查看功能，查询一条模型数据
  * __更新__ ：模型更新功能，更新一条模型数据
  * __删除__ ：模型删除功能，删除一条模型数据
  * __导入__ ：Excel导入，选择文件导入模型数据。
  * __导出__ ：Excel导出，将模型数据导出为Excel。

* __生成接口：__

  生成应用代码时，是否生成RESTful API中的接口。

* __生成页面：__

  生成应用代码时，是否根据模型字段生成增删查改页面。页面采用百度 [Amis](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index) 开发。
  生成的页面可以在`页面`菜单中查看，点击`设计`按钮可以用`Amis在线编辑器`设计和调试页面。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1521747905876_.pic.jpg)

  Amis在线编辑器
![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1531747906033_.pic.jpg)

* __生成菜单：__

  生成应用代码时，是否将本模块的页面自动挂载到系统菜单。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1201747480447_.pic.jpg)

## 4. 应用配置
---

创建应用时会为应用生成3个配置文件，用户也可以自定义新增或删除配置文件。

* `dev`: 开发环境；用于本地开发和调试
* `uat`: 测试环境；用于应用测试
* `prod`: 生产环境；正式上线用

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1551747906544_.pic.jpg)

用户可以修改配置文件并下发到应用，配置文件分为`系统配置`和`业务配置`，支持`YAML`格式。业务配置用户可以自行修改，系统配置由左侧系统选项决定，无法自行修改。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1571747907402_.pic.jpg)

## 5. 启动开发工具
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


## 6. 访问应用
---

如图所示应用起动成功后，选择`开发`菜单，打开页面右侧的应用地址可以直接访问该应用。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1501747901234_.pic.jpg)

默认用户名和密码为：`admin` / `admin`

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1511747901261_.pic.jpg)

用户登入后点击菜单栏可进入相关的模块。

## 7. 打包和发布
---

选择`构建`菜单，列表中可以查看已经构建好的软件版本（Docker镜像）。点击`开始构建`按钮可以进行新版本构建。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1541747906231_.pic.jpg)

## 8. 实例管理
---

选择`实例`菜单，可以查看当前应用所有实例的运行状态、版本、地址和端口。点击`创建实例`可以创建新的应用实例，选择对应的配置和应用版本，每个环境只可以启动一个实例。
用户可以通过主机地址可以直接访问应用。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1581747912911_.pic.jpg)

点击实例`详情`可以查看该应用实例的基本信息、日志等。当有新版本应用时，用户可以点击`切换版本`将当前实例切换到新版本。当新版本有重大问题时用户也可以通过此功能回退到上一个版本。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot/1591747912938_.pic.jpg)

