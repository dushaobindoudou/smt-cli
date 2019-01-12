/*
 * File: build.js
 * Project: smt-cli
 * File Created: 2019-01-11 10:59:37 am
 * Author: dushaobin (dushaobindoudou@gmail.com>)
 * -----
 * Last Modified: 2019-01-11 11:19:58 am
 * Modified By: dushaobin (dushaobindoudou@gmail.com>)
 * -----
 * Copyright (c) smartmesh 2018
 */

// 读取源代码，然后一个一个编译完成，不能自动link因为如果自动link会有导致编译
// 后的内容很大，需要自动编译完成，然后使用发布后的地址进行link可以复用已经在
// 链上合约，上传的顺序可以通过代码确定，合约只支持相对目录的引用，不支持其他的
// 引用方式，以后可以添加手动link

const path = require('path');
const fs = require('fs');
const fsa = require('fs-extra');
const glob = require('glob');
const solc = require('solc');

const util = require('../../utils/util');
const print = require('../../utils/print');
const conf = require('../../config/conf');


// 获取合约配置信息
function getContractConf() {
    const projectInfo = util.getSmtProjectInfo();
    let contractInfo = {};
    if (projectInfo.smtConfData) {
        contractInfo = projectInfo.smtConfData.contract;
    }
    projectInfo.contract = Object.assign(conf.contract, contractInfo);
    // smtServerDir 就是项目根目录
    projectInfo.smtContractDir = path.join(projectInfo.smtServerDir, path.sep,
        projectInfo.contract.dir);
    projectInfo.smtContractSrc = path.join(projectInfo.smtContractDir, path.sep,
        projectInfo.contract.source);
    projectInfo.smtContractDist = path.join(projectInfo.smtContractDir, path.sep,
        projectInfo.contract.dist);
    return projectInfo;
}


// 输出目的地址
function getDistPath(sourcePath, contractSrc, contractDist) {
    const relPath = sourcePath.replace(contractSrc, '');
    const distName = relPath.replace(path.extname(relPath), '.json');
    const distPath = path.join(contractDist, distName);
    return distPath;
}

function findImports(imPath) {
    if (!fs.existsSync(imPath)) {
        return { error: '没找到：' + imPath };
    }
    return { contents: fs.readFileSync(imPath, { encoding: 'utf8' }) };
}

// 获取配置信息
const projectInfo = getContractConf();
function compile(solPath) {
    if (!fs.existsSync(solPath)) {
        print.red('没找到合约：', solPath);
        return;
    }
    print.out('开始编译：', solPath);
    const compileConf = Object.assign({}, projectInfo.contract.buildConfig);
    const solSource = fs.readFileSync(solPath, { encoding: 'utf8' });
    compileConf.sources = {
        [solPath]: {
            content: solSource,
        },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(compileConf), findImports));

    fsa.outputJsonSync(
        getDistPath(solPath, projectInfo.smtContractSrc, projectInfo.smtContractDist),
        output,
        { spaces: 4 },
    );
    print.out('编译完成：', solPath);
}


function readSource() {
    if (!fs.existsSync(projectInfo.smtContractSrc)) {
        print.red('没找到合约代码目录');
        return;
    }
    const sourceSol = glob.sync(projectInfo.smtContractSrc + path.sep + '**' + path.sep + '**' + projectInfo.contract.ext);
    sourceSol.forEach((solPath) => {
        compile(solPath);
    });
}

function build() {
    readSource();
}

module.exports = {
    build,
};
