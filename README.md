# Nebula低代码平台

## 一、功能演示
 ### 1.模型设计
 ### 2.代码生成
 ### 3.中间件管理
 ### 4.实例管理
 ### 5.配置中心
 ### 6.系统管理

## 二、快速开始


### 1. 环境配置

 * [Node.js v16+](https://nodejs.org/zh-cn/download)

### 2. 启动

### 1.安装Docker/DockerCompose

### 2.启动socat实例
```bash
docker run -d --name socat-local --restart always -p 127.0.0.1:2375:2375 -v /var/run/docker.sock:/var/run/docker.sock alpine/socat tcp-listen:2375,fork,reuseaddr unix-connect:/var/run/docker.sock
```

### 3.配置环境变量
```bash
export NEBULA_NODE_HOME=/opt/node-v16.13.1-linux-x64
```

## 三、参考

### 1.配置文件

#### 1.1 数据库 database

## 技术栈
|名称|名称|
|---|---|
|顶起|sdf|
