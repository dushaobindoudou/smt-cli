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

    },
    contract: {
        network: {
            url: '', // infure 地址
            mnemonic: '',
        },
        ext: '.sol', // 编译文件的扩展名
        sourceDir: 'contract/source/',
        buildDist: 'contract/dist/',
        buildConfig: {
            language: 'Solidity',
            settings: {
                outputSelection: {
                    '': {
                        '*': '*'
                    },
                    '*': {
                        '*': [ '*' ]
                    }
                }
            }
        }
    }
}
