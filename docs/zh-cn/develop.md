# 开发

## 1. 技术栈
---

  * [Sequelize](https://sequelize.org/)
  
    `Sequelize` 是一个基于 promise 的 Node.js ORM, 目前支持 `Postgres`, `MySQL`, `MariaDB`, `SQLite` 以及 `Microsoft SQL Server`. 它具有强大的事务支持, 关联关系, 预读和延迟加载,读取复制等功能。

  * [Amis](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index)

    百度`amis` 是一个低代码前端框架，它使用 `JSON` 配置来生成页面，可以减少页面开发工作量，极大提升效率。

  * [Agenda.js](https://github.com/agenda/agenda)

    `Agenda.js`是一个轻量级的任务调度库，它允许开发者设置在特定时间执行或重复执行的任务。通过其`MongoDB`后端，Agenda.js为`Node.js`提供了持久性和故障恢复特性，非常适合用于处理周期性的API任务

  * [Minio](https://min.io/)
    `MinIO` 是一种高性能、S3 兼容的对象存储。它是为 大规模 AI/ML、数据湖和数据库工作负载。它是软件定义的 并在任何云或本地基础设施上运行。 MinIO 具有双重许可 根据开源 GNU AGPL v3 和商业企业许可证
       
  * [Camunda]()
    `Camunda`‌是一个开源的业务流程管理（BPM）平台，支持BPMN 2.0、CMMN 1.1和DMN 1.3标准。它提供了一个流程引擎，可以嵌入到任何Java应用程序或运行时容器中。Camunda的核心组件包括流程引擎、任务列表、控制台和管理员工具，支持复杂的企业级流程和微服务架构中的跨服务流程编排‌



  * [Docker]()

## 2. 项目结构
---

```text
    src
     |--bin
     |--config
     |--docs
     |--jobs
     |--models
     |--routers
          |--api  
          |--rest
          |--root
     |--service
     |--static
     |--utils
     |--views
```

## 3. 业务开发
---


#### 3.1 使用RESTful接口查询数据

#### 3.2 定义一个接口

本平台对`koa`路由进行了封装，使用户定义接口更方便。只需要新建一个`ts`文件定义出接口的请求路径、请求方式（`GET`、`POST` ...）、实现内容即可。
 * XxxRest.ts，请置于`/routers/rest`目录下，该接口将以`/rest`作为前缀。
 * XxxApi.ts，请置于`/routers/api`目录下，该接口将 以`/api`作为前缀。
 * Xxx.ts，请置于`/routers/root`目录下，该接口没有任何前缀。

如下所示，页面最终请求路径为`/api/dashboard`。
routers/api/XxxApi.ts
```javascript
'get /dashboard': async (ctx: NebulaKoaContext, next) => {
    
    // do something
    
    ctx.ok({
        dashboardData
    })
}
```

#### 3.3 数据库操作

* 模型查询
```javascript
const list = await XxxModel.findAll({
    where: {
        id: {
            [Op.in]: [1,2,3] 
        }
    },
    attributes: ['id','name','phone'],
    limit: 20
})
```
* 原生SQL查询
```javascript
const sql = 'select * from t_user'
const [ result ] = await nebula.sequelize.query(sql)
```
