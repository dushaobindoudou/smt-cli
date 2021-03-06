/*
 * File: index.js
 * Project: smt-cli
 * File Created: 2018-11-14 9:12:58 am
 * Author: dushaobin
 * -----
 * Last Modified: 2018-11-14 9:13:16 am
 * Modified By: dushaobin
 * -----
 * Copyright (c) smartmesh 2018
 */


const Command = require('../../base/Command');

const print = require('../../utils/print');

const contract = new Command({
    name: 'contract',
    description: '智能合约',
    command: 'contract',
});

contract.addHelpSpec('智能合约');
contract.addHelpExample('   smt contract build');


const build = new Command({
    name: 'build',
    description: '构建合约',
    command: 'build',
    action: (cmd, opts) => { 
        // eslint-disable-next-line
        const buildCmd = require('./build');
        buildCmd.build();
        // 启动服务 默认情况
        // print.out('该命令目前暂未实现');
    },
});

build.addHelpSpec('构建智能合约');
build.addHelpExample('   smt contract build');


const publish = new Command({
    name: 'publish',
    description: '发布合约',
    command: 'publish',
    action: (cmd, opts) => {
        // 启动服务 默认情况
        print.out('该命令目前暂未实现');
    },
});

publish.addHelpSpec('发布智能合约');
publish.addHelpExample('   smt contract publish');


const link = new Command({
    name: 'link',
    description: '链接合约',
    command: 'link',
    action: (cmd, opts) => {
        // 启动服务 默认情况
        print.out('第一版会实现link命令，以后会废弃');
    },
});

publish.addHelpSpec('链接合约');
publish.addHelpExample('   smt contract link');


contract.addSubCmd(build);
contract.addSubCmd(publish);
contract.addSubCmd(link);

module.exports = contract;
