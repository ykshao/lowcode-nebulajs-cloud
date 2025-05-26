# 系统功能

系统管理功能为`Nebulajs`云端自带的管理功能，此模块架构方式为`SAAS`模式。各子应用无需开发维护。
每个子应用会分配一个租户，彼此之间所有数据隔离。

## 1. 组织管理

---
* __组织管理__

用户组织新增、修改、删除等功能。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1611747915966_.pic.jpg)

* __用户分配__

为组织分配用户。点击左边的组织树先选中一个组织，再点击分配用户按钮，用户可从弹窗中选择用户增加到该组织。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1651747916161_.pic.jpg)

## 2. 角色管理

* __角色管理__

角色新增、修改、删除等功能。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1631747916097_.pic.jpg)

* __分配菜单__

为角色分配菜单。勾选列表中的角色，再点击分配菜单按钮，用户可从弹窗中选择哪些菜单增加到该角色。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1691747916349_.pic.jpg)

## 3. 用户管理

* __用户管理__

用于对系统用户进行统一管理，包括用户信息的增删改查、权限分配、状态控制等，确保系统安全性和数据完整性。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1621747916019_.pic.jpg)

* __分配角色__

为用户分配角色。勾选列表中的用户，再点击分配角色按钮，用户可从弹窗中选择哪些角色增加到该用户。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1681747916326_.pic.jpg)

* __重置密码__

管理员可以为用户重置密码。

## 4. 菜单管理

菜单新增、修改、删除等功能。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1671747916297_.pic.jpg)

* __绑定页面__

菜单可能通过绑定页面，路由到不同的页面。

* __解除绑定__

将菜单和页面解除绑定，路由为空。

## 5. 字典管理

数据字典新增、修改、删除等功能。数据字典可设置字典的编码、显示、值、顺序等字段。
用户在开发过程中，通过查询字典编码获取到一个字典列表用于表单的填写和展示。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1661747916241_.pic.jpg)

## 6. 流程功能 

#### 6.1 流程分组

用户可以通过流程分组将流程进行归类，从而更好的管理流程。

#### 6.2 新增流程

新增一个流程定义，如请假流程。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1741748086514_.pic.jpg)

* __绑定模型__

    流程新增时可以绑定一个表单模型，每个流程节点都会看到此表单，可以设置表单中字段的隐藏、不可用等权限。此处用于数据模型表单的流程控制，如：审批、上报等。
    > 此模型需要打开发起流程功能，并指定状态字段，参考[创建模型](zh-cn/guide?id=_2-%e5%88%9b%e5%bb%ba%e4%b8%80%e4%b8%aa%e6%a8%a1%e5%9e%8b)

* __运行环境__

    用户需要指定流程消息发送的环境。此处可以多选，云平台根据所选会向不同的环境发送`流程事件`。创建应用时系统已经以程序模板中实现了流程的相关功能，如需要对流程事件进行`定制`可以自行修改。
    
    子应用中，`src/config/constants.ts`
  
    ```javascript
    export const SocketEvent = {
        // 表单更新
        ProcessFormUpdate: 'ProcessFormUpdate',
        // 任务创建
        ProcessTaskCreated: 'ProcessTaskCreated',
        // 任务完成
        ProcessTaskCompleted: 'ProcessTaskCompleted',
        // 任务取消
        ProcessTaskDeleted: 'ProcessTaskDeleted',
        // 流程结束
        ProcessInstanceCompleted: 'ProcessInstanceCompleted',
        // 流程终止
        ProcessInstanceTerminated: 'ProcessInstanceTerminated',
    }
    ```

    src/services/message-handler.ts
    
    ```javascript
    static async handleProcessFormUpdateMessage(params) {
        nebula.logger.info('received process form update message: %o', params)
        // do something
    }
    static async handleProcessTaskCreatedMessage(params) {
        nebula.logger.info('process task create message: %o', params)
        // do something
    }
    static async handleProcessTaskCompletedMessage(params) {
        nebula.logger.info('process task complete message: %o', params)
        // do something
    }
    static async handleProcessTaskDeletedMessage(params) {
        nebula.logger.info('process task delete message: %o', params)
        // do something
    }
    static async handleProcessInstanceCompletedMessage(params) {
        nebula.logger.info('process instance complete message: %o', params)
        // do something
    }
    static async handleProcessInstanceTerminatedMessage(params) {
        nebula.logger.info('process instance terminated message: %o', params)
        // do something
    }
    ```



#### 6.3 流程设计

点击流程`设计`按钮可跳转到流程设计器页面。

* __基础信息__

  设置流程的基本信息。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1751748086827_.pic.jpg)

* __审批表单__

  流程所绑定模型的表单信息。当流程绑定模型后自动生成该表单，可以修改表单的布局、字段等信息，此处不会影响到该模型的增加、更改的页面。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1761748086827_.pic.jpg)

* __审批流程__


  此处可以设计流程流转信息，点击`+`可以增加一个任务节点。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1781748086853_.pic.jpg)

  点击节点可以设置节点的属性。
![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1771748086827_.pic.jpg)

#### 6.4 流程处理

* __提交撤回__

在模型列表页面点击`提交`可以对该条数据提交到流程，用户也可以撤回流程。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1791748088407_.pic.jpg)

* __待办__

显示所有本用户的待办任务列表

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1801748088444_.pic.jpg)

* __处理__

点击`处理`按钮显示该流程的详细信息，右侧会显示表单的审批记录。

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1821748088489_.pic.jpg)

* __已办__

显示所有本用户的已办任务列表

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1831748088600_.pic.jpg)

* __我发起的__

显示所有由本用户发起的流程列表

![](https://nebulajs-1251015100.cos.ap-chengdu.myqcloud.com/screenshot%2Fsystem%2F1841748088615_.pic.jpg)


