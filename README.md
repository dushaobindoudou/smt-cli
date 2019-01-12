# smartmesh 集成开发工具

## 简介

该工具是针对smartmesh开发的集成开发工具，包括合约的开发、构建、发布，webapp开发、构建 等等和其他的一系列的开发模块，帮助smartmesh合约开发人员快速开发dapp。


## webapp功能说明

工具是针对多页面的React架构进行开发的，如果项目非该结构，建议直接使用webpack配置，
使用这个工具反而增加了复杂度，但是也可以满足需求

项目结构(实例)：

```
----project
    ----dist
    ----doc
    ----client  前端代码
        ----config     项目使用配置
        ----doc     项目说明文档
        ----scripts     项目可能用到的脚本
        ----src     项目源代码
            ----common      包含项目通用的代码
                ----page    项目的模板
                    ----layout1     模板
                        ----assets      模板用到资源
                        ----layout.tpl      模板
                        ----layout.js       模板执行的脚本
                        ----layout.scss     模板使用样式文件
                    ----layout2
                ----static      通用的资源，样式库、字体、第三方类库
                ----ui      项目中通用的 React 组件
                ----widget      项目使用的通用 widget
                    ----wgt1      
                        ----wgt.tpl     模板
                    ----wgt2
            ----module1     项目模块
                ----page        模块中的页面
                    ----page1       页面
                        ----assets      页面使用的资源     
                        ----page.tpl    页面模板
                        ----page.js     页面使用脚本
                        ----page.scss   页面用到的样式文件
                    ----page2
                ----ui
                ----widget
            ----module2
        ----vendor
        ----package.json
        ----yarn.lock
    ----src
    ----package.json
    ----yarn.lock
```

1. 支持对指定的模块进行自定义配置
2. 支持对指定页面进行自定义配置
3. 支持对现有配置进行覆盖，需要在配置中完全自定义，如果自定义会覆盖现有的所有配置
4. 支持在server 目录 和 client 目录下进行运行命令

约束：

1. 原则上每个页面下面只能有一个js、jsx、ts、tsx文件， 一个样式文件
2. 页面用使用到资源需要用过js文件来进行引用
3. 每个项目只能配置一个 dll配置
4. 每个项目有一个基础的配置，可以对某些指定的模块进行配置

文件说明：

项目的配置文件默认为: .smt.config.js     
项目生成一文件会放在: .smtConfig/     

自定义webpack 配置 需要修改 .smtConfig/webpack/       
webpack配置文件命名：webpack.config.[模块名].[页面名].js       

## 合约开发说明
待完善

## 安装

使用    
npm install -g smt-cli    

## 使用

```
smt                    默认命令
smt init               初始化项目
smt server             服务端命令
smt server build       构建服务端代码
smt server start       启动服务
smt bundle             构建前端代码
smt bundle all         构建前端所有模块
smt debug              调试前端模块 暂未实现
smt contract           智能合约
smt contract build     构建智能合约
smt contract publish   发布智能合约
```

命令实例：

````

       SSSSSSSSSSSSSSS     MMMMMMMM               MMMMMMMM    TTTTTTTTTTTTTTTTTTTTTTT
     SS:::::::::::::::S    M:::::::M             M:::::::M    T:::::::::::::::::::::T
    S:::::SSSSSS::::::S    M::::::::M           M::::::::M    T:::::::::::::::::::::T
    S:::::S     SSSSSSS    M:::::::::M         M:::::::::M    T:::::TT:::::::TT:::::T
    S:::::S                M::::::::::M       M::::::::::M    TTTTTT  T:::::T  TTTTTT
    S:::::S                M:::::::::::M     M:::::::::::M            T:::::T
     S::::SSSS             M:::::::M::::M   M::::M:::::::M            T:::::T
      SS::::::SSSSS        M::::::M M::::M M::::M M::::::M            T:::::T
        SSS::::::::SS      M::::::M  M::::M::::M  M::::::M            T:::::T
           SSSSSS::::S     M::::::M   M:::::::M   M::::::M            T:::::T
                S:::::S    M::::::M    M:::::M    M::::::M            T:::::T
                S:::::S    M::::::M     MMMMM     M::::::M            T:::::T
    SSSSSSS     S:::::S    M::::::M               M::::::M          TT:::::::TT
    S::::::SSSSSS:::::S    M::::::M               M::::::M          T:::::::::T
    S:::::::::::::::SS     M::::::M               M::::::M          T:::::::::T
     SSSSSSSSSSSSSSS       MMMMMMMM               MMMMMMMM          TTTTTTTTTTT

    ======================================================================================

    当前版本: 0.1.0
    smt cli 为smt项目提供快捷易用的命令

命令:
    bundle                                        打包客户端资源
    contract                                      智能合约
    debug                                         调试应用
    init                                          初始化smt项目
    server                                        后端node服务
选项:
    -v, --version                                 显示当前版本
    -h, --help                                    帮助说明

````

## 配置模板

## 开发说明

配置例子：
```
const path = require('path');
// const 

module.exports = {
    "projectType": "react",
    "prefix": "",
    "publicPath": "/static/",
    "dist": "../../dist",
    "clientAlias": "client",
    "isInlineCss": "false",
    "smtConfig": "./.smtConfig/",
    "smtWebpackConfigDir": "{{smtConfig}}/webpack/",
    "smtManifsetDir": "{{smtConfig}}/manifest/",
    "configIn": "client",
    "client": {
        "assetsDir": "./assets/",
        "vendorDir": "vendor/",
        "sourceDir": "./src",
        "cssModulesTypings": false, // 配置是否生成 css module declear文件    ***** New *****
        "dll": {
            "vendors": [
                "core-js",
                "react",
                "react-dom",
                "lodash",
                "axios",
                "antd",
                "history",
                "react-router-dom",
                "mobx",
                "mobx-react",
            ],
            "css": [
                path.resolve(__dirname, './src/common/static/css/base.scss'),
            ],
            sassIncludePaths: [
                path.resolve(__dirname, './src/'),
            ],
            resolve: {},
            module: {},
            plugins: [],
        },
        "common": {
            template: ' ',
            resolve: {
            },
            sassIncludePaths: [
                path.resolve(__dirname, './src/'),
            ],
            module: {},
            plugins: [],
        },
        'base': {
            template: '',
            watchOptions: {},
            resolve: {},
            sassIncludePaths: [
                path.resolve(__dirname, './src/'),
            ],
            module: {},
            plugins: [],
        },
    },
    "server": {
        "relPath": "../../",
        "contentPath": [
            "src/#",
            "package.json"
        ],

    }
}

```

## 更新说明

1. 完成对合约编译的支持


## 需要优化的内容
1. webpack 多个实例chuunk id优化 （fixed）
2. webpack 增加并行编译
3. 优化typescript 编译
4. 添加多线程编译 
5. 添加HRM支持
6. 服务端支持typescript   
7. 支持版本限制
8. 支持一键初始化

## 已知问题
1. 使用nvm 安装首次 **有可能**  需要关闭 shell 重新打开
2. 使用yarn global添加的时候 注意配置 环境变量 export PATH="$PATH:$(yarn global bin)" 
3. 使用taobao npm镜像装 会有一个 包含 `Unexpected end of JSON input while parsing near `的一个error 参考 https://github.com/npm/npm/issues/19072#issuecomment-395788165
4. leek 默认包含了开发的很多依赖，安装过程中有些依赖是 托管到 aws 的 可能会安装失败，例如node-sass 碰到这种情况建议多装一次试试



## 注意事项
1. 在js直接引用node_modules 下的css文件使用 
```
improt 'e/b.css';
```
可能在production模式下面引入失败，需要查看一下模块是否是es模块如果是的话，    
可能会有sideEffects 配置       
2. 如果node-sass安装失败可以使用如下命令试试：
npm install -g smt-cli --unsafe-perm --registry https://registry.npmjs.org/ --sass-binary-site=http://npm.taobao.org/mirrors/node-sass

参考：
https://stackoverflow.com/questions/49160752/what-does-webpack-4-expect-from-a-package-with-sideeffects-false      
  
https://segmentfault.com/a/1190000015689240      


解决方法：

    1. 添加sass文件 使用 sass文件引用
    2. 使用require();


2. 关于Autoprefixer css前缀问题，需要在package.json 添加指定的browserslist

例如：
```
"browserslist": [
    "last 1 version",
    "> 1%",
    "maintained node versions",
    "not dead"
  ]
```


3. 在typescript 中使用 import * as style from '*.scss' 找不到对应的模块

解决方法：
    1. 使用require， 例如： const s = require('*.scss');
    2. 添加typescript 声明文件 *.scss.d.ts
    3. 默认忽略 添加
```
declare module '*.css' {
    interface IClassNames {
      [className: string]: string
    }
    const classNames: IClassNames;
    export = classNames;
}

declare module '*.scss' {
    interface IClassNames {
        [className: string]: string
    }
    const classNames: IClassNames;
    export = classNames;
}
```

4. 预编译（相对安全的方案后续支持）

相关链接：
https://github.com/Jimdo/typings-for-css-modules-loader/issues/33


