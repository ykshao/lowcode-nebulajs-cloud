# from 构建镜像的基础源镜像 该image镜像文件继承官方的node image
FROM node:18

# 在容器中创建一个目录
RUN mkdir -p /usr/local/nebula/
RUN mkdir -p /usr/local/nebula/data/
RUN mkdir -p /usr/local/nebula/logs/

# 定位到容器的工作目录
WORKDIR /usr/local/nebula/

# RUN/COPY是分层的，package.json 提前，只要没修改就不会重新安装包
COPY package.json /usr/local/nebula/package.json
COPY .npmrc /usr/local/nebula/.npmrc

#RUN cd /usr/local/nebula/
RUN npm install

# 设置时区
RUN rm -rf /etc/localtime && ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 把当前目录下所有的文件拷贝到 Image 的 /usr/local/app/目录下
COPY bin /usr/local/nebula/bin
COPY cli /usr/local/nebula/cli
COPY dist /usr/local/nebula/dist
COPY docs /usr/local/nebula/docs
COPY res /usr/local/nebula/res
COPY static /usr/local/nebula/static
COPY templates /usr/local/nebula/templates
COPY views /usr/local/nebula/views

RUN ls /usr/local/nebula/
RUN node -v

EXPOSE 3000
CMD npm start
