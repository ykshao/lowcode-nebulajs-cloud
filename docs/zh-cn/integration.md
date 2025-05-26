# 系统集成

创建应用后，系统会为应用分配一对安全密钥`clientId`和`clientSecret`。
您可以在【设置】菜单中找到，第三方系统可以根据密钥与平台进行对接。

本系统支持标准`OAuth2.0`接口，对接时请根据不同的语言获取相应的OAuth SDK工具包，
以节省人力成本。

## API对接

接口调用采用`OAuth2.0`中的`client_credentials`方式：

#### 1.获取Token
* 请求地址

  ```
  http://{serviceURL}/oauth/token
  ```
* 请求类型
  
  ```
  application/x-www-form-urlencoded
  ```
  

* 请求参数

  |参数|方式|名称|描述|
  |---|---|---|---|
  |client_id|Body|应用ID|`clientId`查看【设置】菜单
  |client_secret|Body|应用Secret|`clientSecret`查看【设置】菜单
  |grant_type|Body|授权方式|固定：`client_credentials`
  |scope|Body|授权范围|固定：`web-app`
  |Content-Type|Header|文本类型|application/x-www-form-urlencoded

* 返回样例
  
  ```javascript
  {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQ......",
    "expires_in": 3600,
    "token_type": "bearer",
    "scope": "web-app"
  }
  ```

#### 2.请求接口
调用平台接口时需要携带第一步中获取的`access_token`，放在`Authorization`请求头中。如下表所示：

* 请求地址
  可调用的接口列表请参考[接口](zh-cn/api.md)

* 请求类型

  ```shell
  application/json
  ```

* 请求参数

  |参数|方式|名称|描述|
  |---|---|---|---|
  |Authorization|Header|应用ID|携带第一步中获取的token，如：`Bearer eyJhbGciOiJSUzI1NiIs...`
  |X-Client-Env|Header|环境|想要请求的环境。`dev`：开发环境，`uat`：测试环境，`prod`：生产环境
  |Content-Type|Header|文本类型|application/json



## 用户集成
用户集成采用`OAuth2.0`中的`code`方式。

首先由客户端生成平台授权跳转链接，用户在平台进行登录，登录后根据在平台配置的回调地址，
携带`code`和`state`参数返回客户端的回调地址，客户端根据参数换取token。详细步骤如下：


#### 1.生成授权链接并跳转

* 请求参数
  
  |参数|方式|名称|描述|
  |---|---|---|---|
  |client_id|Query|应用ID|`clientId`查看【设置】菜单
  |scope|Query|授权范围|固定：`web-app`
  |state|Query|状态验证|随机码
  |redirect_uri|Query|回调地址|客户端回调地址，需要`encodeURIComponent`编码

* 实现方式

  Node.js
  ```javascript
  const authURL =
              '{serviceURL}/oauth/authorize?' +
              'response_type=code&client_id={clientId}' +
              '&state={state}&scope={scope}&' +
              'redirect_uri={redirectUri}'
  return this.formatURL(authURL, {
      serviceURL: this.serviceURL,
      clientId: this.clientId,
      state,
      scope,
      redirectUri: encodeURIComponent(url.href),
  })
  ```

#### 2.获取access_token

* 请求参数

  |参数|方式|名称|描述|
  |---|---|---|---|
  |client_id|Body|应用ID|`clientId`查看【设置】菜单
  |client_secret|Body|应用Secret|`clientSecret`查看【设置】菜单
  |grant_type|Body|授权方式|固定：`authorization_code`
  |redirect_uri|Body|回调地址|客户端回调地址
  |code|Body|授权码|授权码5分钟有效


* 实现方式

  Node.js
  ```javascript
  const { data } = await this.request.post(
      url,
      {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          // scope: 'web-app',
          grant_type: 'authorization_code',
          redirect_uri: callbackURL,
          code,
      },
      {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
      }
  )
  ```


#### 3.拉取用户信息
  参考接口列表[获取用户信息](zh-cn/api.md)
