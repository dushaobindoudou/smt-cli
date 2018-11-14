/**
* @Author: dushaobin <smartmesh>
* @Date:   2017-03-31
* @Email:  dushaobin
* @Project: smt-cli
* @Last modified by:   smartmesh
* @Last modified time: 2017-03-31
*/

const Command = require('../../base/Command');

const print = require('../../utils/print');

function bundleAllModule() {
    // bundle dll

    // bundle common

    // bundle other module

    print.out('该命令目前暂未实现');
}

const debugApp = new Command({
    name: 'debug',
    description: '调试应用',
    command: 'debug',
    action: (cmd, opts) => {
        // 启动服务 默认情况
        bundleAllModule(opts || {});
    },
});

debugApp.addHelpSpec('调试应用');
debugApp.addHelpExample('   smt debug -m common');


module.exports = debugApp;
