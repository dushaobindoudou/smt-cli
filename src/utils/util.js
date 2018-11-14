/**
 * @Author: dushaobin <smartmesh>
 * @Date:   2017-04-01
 * @Email:  dushaobin
 * @Project: smt-cli
 * @Last modified by:   smartmesh
 * @Last modified time: 2017-04-01
 */

const path = require('path');
const os = require('os');
const fs = require('graceful-fs');
const crypto = require('crypto');
const pad = require('pad');
const shelljs = require('shelljs');
const { Spinner } = require('cli-spinner');

const conf = require('../config/conf');
const print = require('./print');

let gloSpinner = null;

const pwd = process.cwd();

const tmpDir = `${process.env.HOME}/.grnTemp/`;

// 该命令行必须在项目根目录运行
function getPckageInfo(dir) {
    const packagePath = path.join(dir || pwd, '/package.json');
    if (!fs.existsSync(packagePath)) {
        // print.red('package.json文件不存在，请在项目根目录下运行');
        return null;
    }
    try {
        const pkg = fs.readFileSync(packagePath);
        return JSON.parse(pkg);
    } catch (e) {
        print.red(conf.text.pkgParseError);
    }
    return null;
}

// 获取时间戳
function getTimesp() {
    const timesp = (new Date()).getTime();
    return () => `${timesp}`;
}

// 创建当前的临时时间戳
const currRunTimesp = getTimesp();

// 获取临时目录信息
function getTempDirs() {
    const timesp = currRunTimesp();
    const currDir = path.join(tmpDir, timesp, path.sep);
    return {
        tmpDir,
        currDir,
    };
}

function mkTempDir(dirName) {
    const tmpInfo = getTempDirs();
    try {
        if (!fs.existsSync(tmpInfo.tmpDir)) {
            fs.mkdirSync(tmpInfo.tmpDir);
        }
        fs.mkdirSync(path.join(tmpInfo.tmpDir, path.sep, dirName));
    } catch (e) {
        print.info(`创建临时目录: ${dirName} 失败`);
    }
}

// 获取配置文件路径
function getConfigPath(dir) {
    if (dir) {
        return path.join(pwd, dir, conf.cons.configFileName);
    }
    return path.join(pwd, conf.cons.configFileName);
}

// 获取配置文件
function getSmtConfig(cPath) {
    const confPath = cPath || getConfigPath();
    try {
        const confModule = require(cPath); // eslint-disable-line global-require
        return confModule;
    } catch (e) {
        print.red(`读取配置文件失败: ${confPath}`);
        print.red(e);
    }
    return null;
}

// 填充空白字符
function piddingReset(str, len) {
    if (!str) {
        return '';
    }
    if (str.length > len) {
        return `${str.substr(0, len - 3)}...`;
    }
    return pad(str, len);
}

// 获取使用信息
function getUsageInfo(cmd, ccmd) {
    if (!cmd) {
        return null;
    }
    const rootCommand = cmd;
    const infos = [];
    if (ccmd) {
        infos.push(conf.text.usageTitle.replace('<{ccmd}>', ccmd));
    }

    if (rootCommand.commands) {
        infos.push(conf.text.commanTitle);
        Object.keys(rootCommand.commands).forEach((v) => {
            infos.push(piddingReset(`    ${rootCommand.commands[v].command}`, 50) + rootCommand.commands[v].description);
        });
    }

    if (rootCommand.options) {
        infos.push(conf.text.optionsTitle);
        Object.keys(rootCommand.options).forEach((v) => {
            infos.push(piddingReset(`    ${rootCommand.options[v].command}`, 50) + rootCommand.options[v].description);
        });
    }
    return infos;
}

// 输出命令行帮助文档
function printCmdHelp(cmd) {
    const infos = getUsageInfo(cmd);
    infos.forEach((v) => {
        print.out(v);
    });
}

function printCmdTitle(cmdName) {
    let cName = '';
    if (cmdName) {
        cName = `${cmdName} `;
    }
    print.out(conf.text.usageTitle.replace('<{ccmd}>', cName));
}


// 获取本机的ip地址
function getIpAddr() {
    const ifaces = os.networkInterfaces();
    const ips = [];
    Object.keys(ifaces).forEach((ifname) => {
        ifaces[ifname].forEach((iface) => {
            if (iface.family !== 'IPv4' || iface.internal !== false) {
                return;
            }
            ips.push(iface.address);
        });
    });
    return ips;
}

// 获取匹配的cmd
function matchOpt(cmd, opt) {
    let optCmd = null;
    if (!cmd || !cmd.$options || !opt) {
        return optCmd;
    }
    Object.keys(cmd.$options).forEach((v) => {
        if (!v) {
            return;
        }
        const ks = v.split(';');
        ks.forEach((vs) => {
            if (vs === opt) {
                optCmd = cmd.$options[v];
            }
        });
    });
    return optCmd;
}

// 匹配hooks
function matchHook(cmd, opt) {
    let optCmd = null;
    if (!cmd || !cmd.$options || !opt) {
        return optCmd;
    }

    Object.keys(cmd.$options).forEach((v) => {
        if (!v) {
            return;
        }
        const ks = v.split(';');
        ks.forEach((vs) => {
            if (vs === opt) {
                optCmd = cmd.$options[v];
            }
        });
    });
    return optCmd;
}

// 打开新的shell 窗口，需要动态生成脚本
function startServerInNewWindow(cmdSrc) {
    // const scriptFile = /^win/.test(process.platform) ? 'grnCmd.bat' : 'grnCmd.command';
    const launchPackagerScript = cmdSrc;
    const procConfig = { cwd: process.cwd() };
    if (process.platform === 'darwin') {
        return shelljs.exec(`open ${launchPackagerScript}`, procConfig);
    }
    if (process.platform === 'linux') {
        procConfig.detached = true;
        return shelljs.exec(`sh ${launchPackagerScript}`, procConfig);
    }
    if (/^win/.test(process.platform)) {
        procConfig.detached = true;
        procConfig.stdio = 'ignore';
        return shelljs.exec(`cmd.exe ${['/C', launchPackagerScript].join(' ')}`, procConfig);
    }
    print.red(`Cannot start the packager. Unknown platform ${process.platform}`);
    return false;
}

// 在新窗口中执行hook命令
function execCmd(cmdStr) {
    if (!cmdStr) {
        return;
    }
    const scriptFile = /^win/.test(process.platform) ? 'template.bat' : 'template.command';

    try {
        // 确保临时文件夹存在
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }
    } catch (e) {
        print.red('读取命令脚本失败', e);
        fs.mkdirSync(tmpDir);
    }

    const cmd = fs.readFileSync(path.resolve(__dirname, `../shell/${scriptFile}`), { encoding: 'utf8' });
    const newCmdFile = path.join(tmpDir, 'grnCmd.command');
    const currenWork = process.cwd();

    const newCmdStr = `cd ${currenWork}\n${cmdStr}`;
    const newCmds = cmd.replace('<{cmds}>', newCmdStr);
    try {
        const stat = fs.statSync(newCmdFile);
        if (stat.isFile()) {
            fs.unlinkSync(newCmdFile);
            fs.writeFileSync(newCmdFile, newCmds);
        }
    } catch (e) {
        print.red('读取命令脚本失败', e);
        fs.writeFileSync(newCmdFile, newCmds);
    }

    try {
        shelljs.chmod('-R', 'a+x', newCmdFile);
    } catch (e) {
        print.red('修改脚本权限失败', e);
    }

    startServerInNewWindow(newCmdFile);
}

// 对命令行做排序
function sortCmd(sourceCmd) {
    const sortedCmds = {};
    Object.keys(sourceCmd).sort().forEach((v) => {
        sortedCmds[v] = sourceCmd[v];
    });
    return sortedCmds;
}

function getNpmVersion() {
    return shelljs.exec('npm -v', { silent: true });
}

function getYarnVersion() {
    return shelljs.exec('yarn --version', { silent: true });
}

function startLoading(info, isStatic) {
    if (isStatic) {
        print.out(`${info} --> ... <--`);
        return;
    }
    if (gloSpinner) {
        gloSpinner.start();
        return;
    }
    gloSpinner = new Spinner(`${info} --> %s <-- `);
    gloSpinner.setSpinnerString(18);
    gloSpinner.start();
}

function stopLoading(info, isStatic) {
    if (isStatic) {
        return;
    }
    if (gloSpinner) {
        gloSpinner.stop();
        gloSpinner = null;
    }
    print.out(info);
}

function hasSmtConf(lcPath) {
    if (!lcPath) {
        return false;
    }
    const fsList = fs.readdirSync(lcPath);
    let isFinded = false;
    fsList.forEach((fileName) => {
        if (fileName.indexOf(conf.cons.configFileName) > -1) {
            isFinded = true;
        }
    });
    return isFinded;
}

function hashStr(str, len) {
    if (!str) {
        return null;
    }
    const leng = (len > 0) ? len : 6;
    const sha256 = crypto.createHash('sha256');
    sha256.update(str);
    const hv = sha256.digest('hex');
    return hv.substr(0, leng);
}

// 由于当前运行的目录比较模糊，不知道在哪里但是一定，需要在package.json根目录下
// 当前的package.json下又没有发现.smt.config.js 所有需要向上搜索一级，向下搜索一级
// 如果没找到则说明当前项目不是smt项目，如果找到了再走后续流程
function findSmtConf(source) {
    const parentPath = path.join(source, '../');
    const isGetSmtConf = hasSmtConf(parentPath);
    const res = {};
    if (isGetSmtConf) {
        res.currentRun = pwd;
        res.smtConfDir = parentPath;
        res.smtConfPath = path.join(parentPath, conf.cons.configFileName);
        res.hasSmtConf = isGetSmtConf;
        res.smtConfData = getSmtConfig(path.join(parentPath, conf.cons.configFileName));
        return res;
    }
    const currDirs = fs.readdirSync(source);
    let isSearchedSmtConf = false;
    const searchRes = {};
    currDirs.forEach((dir) => {
        const dirStat = fs.statSync(dir);
        if (dirStat.isDirectory()) {
            const absDir = path.join(source, dir);
            if (hasSmtConf(absDir)) {
                isSearchedSmtConf = true;
                searchRes.hasSmtConf = isSearchedSmtConf;
                searchRes.smtConfDir = absDir;
                searchRes.currentRun = pwd;
                searchRes.smtConfPath = path.join(absDir, conf.cons.configFileName);
                searchRes.smtConfData = getSmtConfig(path.join(absDir, conf.cons.configFileName));
            }
        }
    });
    if (isSearchedSmtConf) {
        return searchRes;
    }
    return null;
}

function currentRunServerDir(smtConfOpts) {
    if (!smtConfOpts) {
        return null;
    }
    const smtConf = Object.assign({}, smtConfOpts);
    const dirs = smtConf.currentRun.split(path.sep);
    if (dirs[dirs.length - 1].indexOf(smtConf.smtConfData.clientAlias) > -1) {
        smtConf.isExecInServer = false;
    } else {
        smtConf.isExecInServer = true;
    }
    if (smtConf.isExecInServer) {
        smtConf.smtServerDir = smtConf.currentRun;
        smtConf.smtClientDir = path.join(smtConf.currentRun, smtConf.smtConfData.clientAlias);
    } else {
        dirs.pop();
        smtConf.smtServerDir = dirs.join(path.sep);
        smtConf.smtClientDir = smtConf.currentRun;
    }
    return smtConf;
}

// 检测当前是否运行在smt项目中
function getSmtProjectInfo() {
    let res = {
        hasSmtConf: false,
    };
    const isGetSmtConf = hasSmtConf(pwd);
    if (isGetSmtConf) {
        // 当前目录包含 smt config 文件
        res.hasSmtConf = true;
        const smtConfPath = path.join(pwd, conf.cons.configFileName);
        const smtConfData = getSmtConfig(smtConfPath);
        res.currentRun = pwd;
        res.smtConfDir = pwd;
        res.smtConfPath = smtConfPath;
        res.smtConfData = smtConfData;
        res = currentRunServerDir(res);
        return res;
    }
    // 当前运营的路径 仅支持 要么在 client 根目录 要么在 server根目录
    // 加入在client目录运行则最后一级目录是client
    // 假如在server端运行，则必包含一级目录为client
    let smtConf = findSmtConf(pwd);
    if (smtConf) {
        smtConf = currentRunServerDir(smtConf);
        return smtConf;
    }
    return null;
}

function getSmtConfDir(smtConf) {
    if (!smtConf || !smtConf.smtConfData) {
        return null;
    }
    const smtConfDir = path.resolve(smtConf.smtConfDir, smtConf.smtConfData.smtConfig);
    return smtConfDir;
}

function getWebpackConfDir(smtConf) {
    if (!smtConf || !smtConf.smtConfData) {
        return null;
    }
    const webpackConfDir = path.resolve(smtConf.smtConfData.smtWebpackConfigDir.replace('{{smtConfig}}', getSmtConfDir(smtConf)));
    return webpackConfDir;
}

function getManifestConfDir(smtConf) {
    if (!smtConf || !smtConf.smtConfData) {
        return null;
    }
    const webpackConfDir = path.resolve(smtConf.smtConfData.smtManifsetDir.replace('{{smtConfig}}', getSmtConfDir(smtConf)));
    return webpackConfDir;
}

module.exports = {
    getSmtProjectInfo,
    getConfigPath,
    getSmtConfig,
    getSmtConfDir,
    getWebpackConfDir,
    getManifestConfDir,
    getTimesp: currRunTimesp,
    getTempDirs,
    getUsageInfo,
    printCmdHelp,
    piddingReset,
    printCmdTitle,
    matchOpt,
    getIpAddr,
    getPckageInfo,
    execCmd,
    mkTempDir,
    matchHook,
    startServerInNewWindow,
    sortCmd,
    getNpmVersion,
    getYarnVersion,
    startLoading,
    stopLoading,
    hashStr,
};
