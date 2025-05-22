# 操作向导

## 1. 创建一个应用

用户登录后在应用列表中创建一个应用，根据实际情况选择需要的功能模块。分布式文件存储（`Minio`）和工作流（`Camunda`）需要部署对应的第三方中间件。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot/1211747538227_.pic.jpg)

## 2. 创建一个模型

选择`模型`菜单，在模型列表中创建一个模型，并设置基本属性和字段。如果是现有的表也可以选择`从数据库中导入`。

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

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1191747480447_.pic.jpg)


## 3. 生成模型代码

在模型列表页面中，勾选想要生成的模型后进行代码生成，生成代码后可以在Web版的VSCODE中查看文件改动。

* __功能选择__
  * __列表__ ：模型数据列表，支持分页和条件查询
  * __新增__ ：模型新增功能
  * __详情__ ：模型查看功能
  * __更新__ ：模型更新功能
  * __删除__ ：模型删除功能
  * __导入__ ：Excel导入，选择文件导入模型数据。
  * __导出__ ：Excel导出，将模型数据导出为Excel。

* __生成接口：__

  生成应用代码时，是否生成RESTful API中的接口。

* __生成页面：__

  生成应用代码时，是否根据模型字段生成增删查改页面。

* __生成菜单：__

  生成应用代码时，是否将本模块的页面自动挂载到系统菜单。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2F1201747480447_.pic.jpg)

## 4. 启动开发工具

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


## 5. 访问应用

如图所示应用起动成功后，选择`开发`菜单，打开页面右侧的应用地址可以直接访问该应用。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot/1491747833036_.pic.jpg)

默认用户名和密码为：`admin` / `admin`

## 6. 打包和发布



