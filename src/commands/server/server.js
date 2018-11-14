
const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');
const chokidar = require('chokidar');
const shelljs = require('shelljs');

const util = require('../../utils/util');
const print = require('../../utils/print');
const conf = require('../../config/conf');
const serverUtil = require('./serverUtil');

const complieMap = {};

let watchListFile = [];

// 处理watch 列表
function processWatch(v, smtConf, serverConf) {
    if (!v) {
        return;
    }
    if (v.indexOf('#') > -1) {
        const vd = v.replace('#', '');
        watchListFile.push(path.join(smtConf.smtConfPath, serverConf.relPath, vd));
    } else {
        const sourcePath = path.join(smtConf.smtConfPath, serverConf.relPath, v);
        try {
            const matchFiles = glob.sync(sourcePath);
            // tobeFiexed: remove
            // console.log('watch matchFiles:', sourcePath, matchFiles);
            watchListFile = watchListFile.concat(matchFiles);
        } catch (e) {
            print.red(conf.text.server.build.notFoundBuildSource, e);
        }
    }
    watchListFile = watchListFile.filter((item, pos) => watchListFile.indexOf(item) === pos);
}

// 获取配置信息
function getLeeekConfigInfo() {
    const smtConfInfo = util.getSmtProjectInfo();
    if (!smtConfInfo) {
        print.red(conf.text.smtConfNotExist);
    }
    return smtConfInfo;
}

// 获取服务器配置信息
function getServerConfigInfo(smtConfInfo) {
    const serverPgkInfo = serverUtil.getServerPackage(smtConfInfo);
    if (!serverPgkInfo) {
        print.red(conf.text.serverPkgError);
    }
    return serverPgkInfo;
}

// 获取server构建配置
function getServerBuildConf(smtConfInfo, serverPgkInfo) {
    const serverBuildInfo = Object.assign({},
        serverPgkInfo.serverBuildConfig, smtConfInfo.smtConfData.server);
    // const smtConf = util.getSmtConfig();
    if (!serverBuildInfo) {
        print.err(conf.text.server.build.mustBeConf);
    }
    return serverBuildInfo;
}

function checkEnv() {
    const pkgInfo = util.getPckageInfo();
    if (!pkgInfo) {
        print.red(conf.text.pkgNotExist);
        return false;
    }
    const smtConfInfo = getLeeekConfigInfo();
    if (!smtConfInfo) {
        return false;
    }
    const serverPgkInfo = getServerConfigInfo(smtConfInfo);
    if (!serverPgkInfo) {
        return false;
    }
    return true;
}

function buildServer() {
    const pkgInfo = util.getPckageInfo();
    if (!pkgInfo) {
        print.red(conf.text.pkgNotExist);
        return;
    }
    const smtConfInfo = getLeeekConfigInfo();
    if (!smtConfInfo) {
        return;
    }
    // tobeFixed: remove
    // print.info(smtConfInfo);

    const serverPgkInfo = getServerConfigInfo(smtConfInfo);
    if (!serverPgkInfo) {
        return;
    }
    // tobeFixed: remove
    // print.info('project server package info:', serverPgkInfo);

    const serverBuildInfo = getServerBuildConf(smtConfInfo, serverPgkInfo);
    // const smtConf = util.getSmtConfig();
    if (!serverBuildInfo) {
        return;
    }
    print.out(conf.text.server.build.startBuild);
    if (serverBuildInfo.contentPath) {
        serverBuildInfo.contentPath.forEach((v) => {
            if (v) {
                // todofixed: remove
                // print.out(serverBuildInfo);
                processWatch(v, smtConfInfo, serverBuildInfo);
                let dv = v;
                if (v.indexOf('#') > -1) {
                    dv = v.replace('#', '*');
                }
                const sourcePath = path.join(smtConfInfo.smtConfPath,
                    serverBuildInfo.relPath, dv);
                const distPath = path.join(smtConfInfo.smtConfPath,
                    smtConfInfo.smtConfData.dist);
                try {
                    const matchFiles = glob.sync(sourcePath);
                    matchFiles.forEach((mf) => {
                        if (mf) {
                            const dbName = path.basename(mf);
                            fse.copySync(mf, path.join(distPath, dbName));
                            complieMap[mf] = path.join(distPath, dbName);
                        }
                    });
                } catch (e) {
                    print.red(conf.text.server.build.notFoundBuildSource, e);
                }
            }
        });
        print.out(conf.text.server.build.finishedBuild);
    } else {
        print.red(conf.text.server.build.notFoundConf);
    }
    // todoFixed: remove
    // console.log('当前需要监控文件列表:', watchListFile);
}

// 删除编译后的文件
function deleteFile(source) {
    if (!source) {
        return;
    }
    const pkgInfo = util.getPckageInfo();
    if (!pkgInfo) {
        print.red(conf.text.pkgNotExist);
        return;
    }
    const smtConfInfo = getLeeekConfigInfo();
    if (!smtConfInfo) {
        return;
    }
    // tobeFixed: remove
    // print.info(smtConfInfo);
    const serverPgkInfo = getServerConfigInfo(smtConfInfo);
    if (!serverPgkInfo) {
        return;
    }
    const serverBuildInfo = getServerBuildConf(smtConfInfo, serverPgkInfo);
    // const smtConf = util.getSmtConfig();
    if (!serverBuildInfo) {
        return;
    }
    const sourceList = Object.keys(complieMap);
    sourceList.forEach((v) => {
        if (!v) {
            return;
        }
        if (source.indexOf(v) > -1) {
            const target = complieMap[v];
            const relDir = source.replace(v, '');
            const targetPath = path.join(target, relDir);
            fse.removeSync(targetPath);
        }
    });
}

function startWatch() {
    print.out(conf.text.server.build.startWatch);
    if (watchListFile.length > 0) {
        const watcher = chokidar.watch(watchListFile, {
            ignored: /(^|[/\\])\../,
        });
        watcher
            .on('ready', () => {
                // todoFixed: rmove
                // console.log('watch启动完成');
                print.out(conf.text.server.build.startWatchOver);
                watcher
                    .on('add', () => {
                        buildServer();
                    })
                    .on('change', () => {
                        buildServer();
                    })
                    .on('unlink', (wPath) => {
                        deleteFile(wPath);
                    })
                    .on('unlinkDir', (wPath) => {
                        deleteFile(wPath);
                    })
                    .on('error', (err) => {
                        print.red('watch error:', err);
                    });
            });
    }
}

function startServer(opts) {
    const pkgInfo = util.getPckageInfo();
    if (!pkgInfo) {
        print.red(conf.text.pkgNotExist);
        return;
    }
    const smtConfInfo = getLeeekConfigInfo();
    if (!smtConfInfo) {
        return;
    }
    // tobeFixed: remove
    // print.info(smtConfInfo);
    const serverPgkInfo = getServerConfigInfo(smtConfInfo);
    if (!serverPgkInfo) {
        return;
    }
    const serverBuildInfo = getServerBuildConf(smtConfInfo, serverPgkInfo);
    // const smtConf = util.getSmtConfig();
    if (!serverBuildInfo) {
        return;
    }
    // 切换运行环境
    if (!smtConfInfo.isExecInServer) {
        process.chdir(smtConfInfo.smtServerDir);
    }
    let startCmd = serverPgkInfo.scripts && serverPgkInfo.scripts.start;

    if (opts.w || opts.watch) {
        const nodemonPath = require.resolve('nodemon');
        const nodemonCli = path.join(nodemonPath, '../../bin/nodemon.js');
        startCmd = `${nodemonCli} ${serverPgkInfo.main}`;
    } else if (!startCmd && serverPgkInfo.main) {
        startCmd = `node ${serverPgkInfo.main}`;
    }
    if (startCmd) {
        if (opts.e || opts.env) {
            shelljs.exec(`NODE_ENV=${opts.e || opts.env} ${startCmd}`);
        } else {
            shelljs.exec(startCmd);
        }
    } else {
        print.red(conf.text.server.notConfServerStart);
    }
}

module.exports = {
    checkEnv,
    buildServer,
    startWatch,
    startServer,
};
