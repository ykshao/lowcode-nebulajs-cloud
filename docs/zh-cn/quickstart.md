# 快速开始

## 1. 环境配置
---
#### 1.1 Node.js安装
> 本项目基于`Nodejs+Koa2`开发，需要先安装 [Node.js v16+](https://nodejs.org/zh-cn/download)。

```shell
git clone https://gitee.com/nebulajs/nebulajs-cloud.git
cd nebulajs-cloud
npm i
```

#### 1.2 Docker/DockerCompose安装

> 参考Docker官方文档 [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

#### 1.3 环境变量配置

* __NEBULA_NODE_HOME__

配置Nebula应用在Web版`VSCODE`中运行的`nodejs`环境。由于Web版本的`VSCODE`采用Linux作为基础镜像，此处需要配置Linux版本的nodejs，如下所示。

```shell
export NEBULA_NODE_HOME=/opt/node-v16.13.1-linux-x64
```

## 2.中间件配置
---
配置文件存放在`src/config/env/`目录下，可以自行修改。如：dev.ts

* __数据库配置（必须）__

```javascript
database: {
    // dialect: 'mysql',
    // host: '10.126.32.28',
    // port: '3306',
    // username: 'nebula',
    // database: 'nebula_cloud',
    // password: 'nebula123',

    dialect: 'sqlite',
    storage: './db/nebulajs_db.sqlite',
    timezone: '+00:00'
}
```

* __Redis配置（必须）__

```javascript
redis: {
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 6,
    password: 'nebula123'
}
```

* __Mongodb配置（可选）__

如要使用定时任务调度，则需要配置该项。完整配置可参考[mongoose](https://github.com/Automattic/mongoose)。

```javascript
mongodb: {
    uri: 'mongodb://admin:nebula123@10.126.32.28:27017',
    options: {
        dbName: 'nebula_cloud',
    }
}
```



* __MinIO配置（可选）__

如要使用分布式文件存储，则需要配置该项。完整配置可参考[minio-js](https://github.com/minio/minio-js)。


```javascript
minio: {
    endPoint: '10.126.32.28',
    port: 9000,
    useSSL: false,
    accessKey: 'XXXXXXXX',
    secretKey: 'XXXXXXXX',
}
```


* __Camunda工作流配置（可选）__

```javascript
camunda: {
    apiUri: 'http://10.126.32.219:8070/engine-rest',
    headers: {
        Authorization: 'Basic ZGVtbzpkZW1v', //demo:demo
    },
}
```

#### 快速使用Docker启动开发环境

编写`docker-compose.yaml`文件

```yaml
version: '3.0'
services:
  
  minio:
    image: minio/minio:RELEASE.2021-06-17T00-10-46Z
    volumes:
      - ./data:/data
      - ./config:/root/.minio
    container_name: minio
    ports:
      - 9000:9000
    environment:
      MINIO_ACCESS_KEY: admin
      MINIO_SECRET_KEY: admin123 #大于等于8位
    command: server /data
    restart: always
    
  redis:
    container_name: redis
    image: redis:6.2.1
    command:
      - /bin/bash
      - -c
      - redis-server --requirepass "nebula123"
    ports:
      - 6379:6379
  
  mongodb:
    image: mongo:4
    container_name: mongodb
    restart: always
    volumes:
      - ./db:/data/db
      - ./log:/var/log/mongodb
    ports:
      - 27017:27017
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: nebula123
  
  camunda:
    image: camunda/camunda-bpm-platform:latest
    volumes:
      - ./default.yml:/camunda/configuration/default.yml
    container_name: camunda
    ports:
      - 8060:8080
    environment:
      DB_DRIVER: com.mysql.cj.jdbc.Driver
      DB_URL: "jdbc:mysql://x.x.x.x:3306/camunda_db?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Shanghai"
      DB_USERNAME: xxxx
      DB_PASSWORD: xxxx
    restart: always
```

启动
```shell
docker-compose up
```

## 3.服务端配置

* __app.serviceURL__

 云平台服务端地址，用于各子应用和云端应用API通信。（当应用部署在docker或在docker中启动时，此处不要配置`127.0.0.1`，这会导致应用无法连接云端）

* __app.wsServiceURL__ 

 云平台服务端Websocket地址，用于各子应用和云端应用WS通信。（当应用部署在docker或在docker中启动时，此处不要配置`127.0.0.1`，这会导致应用无法连接云端）

* __app.dataPath__ 创建应用后，代码及文件存放的目录

* __app.servers__ 托管应用的docker服务器，通过socat和docker通信，用于应用的运行调试和发布

 > 此处暂时和Nebula云平台配置为同一服务器，后续会支持分布式部署。<br/>
 > <span style="color:red">注意：Socat端口（2375）不要开放到外网，否则会有安全隐患。</span>


```javascript
app: {
    /**
     * 服务端地址
     */
    serviceURL: 'http://127.0.0.1:3000',

    /**
     * 服务端WS地址
     */
    wsServiceURL: 'ws://127.0.0.1:3001',

    /**
     * 应用存放目录
     */
    dataPath: path.join(__dirname, '../../../data'),

    /**
     * Docker通信配置
     */
    servers: {
        default: {
            name: '本地默认',
            // socketPath: '/var/run/docker.sock',
            protocol: 'http',
            host: '127.0.0.1', //host字段需要用到，暂不使用socketPath配置
            port: 2375,
        },
    },
}
```

## 4.启动应用
---

#### 4.1 DockerSocat启动

Nebulajs Cloud平台使用`Socat`和Docker服务器通信。

```shell
docker run -d --name socat-local --restart always -p 127.0.0.1:2375:2375 -v /var/run/docker.sock:/var/run/docker.sock alpine/socat tcp-listen:2375,fork,reuseaddr unix-connect:/var/run/docker.sock
```

#### 4.2 应用启动


* __开发模式启动__

```shell
npm run dev
```

* __生产模式启动__

```shell
pm2 start ecosystem.config.js --env dev
```

