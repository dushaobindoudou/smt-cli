const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const util = require('../../utils/util');
const print = require('../../utils/print');
const wpUtil = require('../../utils/webpackUtil');
const conf = require('../../config/conf');


// 获取配置信息
function getLeeekConfigInfo() {
    const smtConfInfo = util.getSmtProjectInfo();
    if (!smtConfInfo) {
        print.red(conf.text.smtConfNotExist);
    }
    return smtConfInfo;
}

// 获取客户端package.json信息
function getClientConfigInfo(smtConfInfo) {
    if (!smtConfInfo) {
        return null;
    }
    const clientPgkInfo = util.getPckageInfo(smtConfInfo.smtClientDir);
    if (!clientPgkInfo) {
        print.red(conf.text.serverPkgError);
    }
    return clientPgkInfo;
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
    const clientPkgInfo = getClientConfigInfo(smtConfInfo);
    if (!clientPkgInfo) {
        return false;
    }
    return true;
}

function bundleDll(smtConfInfo, clientInfo, cmdOpts, onEnd) {
    let isProd = false;
    if (cmdOpts.e === 'production' || cmdOpts.env === 'production') {
        isProd = true;
    }

    let isWatch = false;
    if (cmdOpts.w || cmdOpts.watch) {
        isWatch = true;
    }
    let noLoading = false;
    if (cmdOpts.n || cmdOpts.noLoading) {
        noLoading = true;
    }

    const distDir = path.join(smtConfInfo.smtConfPath, smtConfInfo.smtConfData.dist);
    let jsEntrys = [];
    if (clientInfo.dll && clientInfo.dll.vendors) {
        jsEntrys = clientInfo.dll.vendors;
    }

    let cssEntrys = [];
    if (clientInfo.dll && clientInfo.dll.css) {
        cssEntrys = clientInfo.dll.css;
    }

    let resolveData = {};
    if (clientInfo.dll && clientInfo.dll.resolve) {
        resolveData = clientInfo.dll.resolve;
    }
    const distVendor = path.join(distDir, clientInfo.module.staticDir, clientInfo.vendorDir);
    const publicPath = path.join(smtConfInfo.smtConfData.prefix,
        smtConfInfo.smtConfData.publicPath);
    const sassIncludePath = clientInfo.dll.sassIncludePaths;
    const opts = {
        isProd,
        isWatch,
        distDir,
        jsEntrys,
        cssEntrys,
        resolve: resolveData,
        distVendor,
        srcDir: path.join(smtConfInfo.smtClientDir, clientInfo.sourceDir), // 项目的源代码目录
        clientNodeModules: path.join(smtConfInfo.smtClientDir, './node_modules'),
        publicPath: path.join(publicPath, clientInfo.vendorDir),
        sassIncludePath,
        manifestConfDir: util.getManifestConfDir(smtConfInfo),
        module: clientInfo.dll.module,
        plugins: clientInfo.dll.plugins,
        assetDir: clientInfo.assetsDir,
        jsonpFn: wpUtil.getJsonpName('dll'),
        fullCusConf: clientInfo.dll,
        cssModulesTypeings: clientInfo.cssModulesTypeings,
    };

    const dllConf = wpUtil.getWebpackConfInfo(smtConfInfo, 'dll');
    const dllWpConf = dllConf.getConfig(opts);
    process.chdir(smtConfInfo.smtClientDir);
    util.startLoading(`${conf.text.bundle.startComplie}dll`, noLoading);
    const webpack = wpUtil.requireModule('webpack', smtConfInfo); // eslint-disable-line global-require
    webpack(dllWpConf, (err, stats) => {
        const info = stats.toJson();
        util.stopLoading(conf.text.bundle.endComplie, noLoading);
        print.out(`编译耗时： ${(info.time / 1000)} s`);
        wpUtil.printWebpackError(err, stats, info);
        if (onEnd) {
            onEnd();
        }
    });
}

function bundleModule(moduleName, pmoduleInfo, smtConfInfo, clientInfo, opts, onEnd) {
    const moduleInfos = {
        entry: [],
        noEntry: [],
        watchFiles: [],
    };

    if (!pmoduleInfo || !pmoduleInfo[moduleName]) {
        print.out(`没有找到 ${moduleName} 模块`);
        return;
    }
    const mInfo = pmoduleInfo[moduleName];
    let isWatch = false;
    let isProd = false;
    let inlineCss = false;
    let noLoading = false;
    if (opts.w || opts.watch) {
        isWatch = true;
    }

    if (opts.e === 'production' || opts.env === 'production') {
        isProd = true;
    }

    if (opts.i || opts.inlineCss) {
        inlineCss = true;
    }

    if (opts.n || opts.noLoading) {
        noLoading = true;
    }

    const publicPath = path.join(smtConfInfo.smtConfData.prefix,
        smtConfInfo.smtConfData.publicPath);

    const distDir = path.join(smtConfInfo.smtConfPath, smtConfInfo.smtConfData.dist);
    let tplInfo = null;
    const pageName = opts.p || opts.page;
    if (_.isString(pageName) && pageName) {
        const specPagePath = path.join(mInfo.pagePath, pageName);
        if (!fs.existsSync(specPagePath)) {
            print.out('没有找到指定的页面');
            print.out(specPagePath);
            return;
        }
        // finalPath = specPagePath;
        tplInfo = wpUtil.findTpl(smtConfInfo, {
            moduleName,
            isWatch,
            isProd,
            publicPath,
            finalPath: specPagePath,
            incss: inlineCss,
            moduleDir: mInfo.moduleRoot, // 当前模块的路径 jsEntry是相对该目录的
            srcDir: path.join(smtConfInfo.smtClientDir, clientInfo.sourceDir), // 项目的源代码目录
            clientNodeModules: path.join(smtConfInfo.smtClientDir, './node_modules'),
            assetDir: clientInfo.assetsDir,
            sassIncludePath: clientInfo.common.sassIncludePaths,
            distDir,
            manifestDir: util.getManifestConfDir(smtConfInfo),
            commonJSName: clientInfo.commonJSName || 'manifest-commonDll.json',
            commonCssName: clientInfo.commonCSSName || 'manifest-commonCss.json',
            cssModulesTypings: clientInfo.cssModulesTypings,
        }, clientInfo);
    } else {
        // 获取页面信息
        tplInfo = wpUtil.findTpl(smtConfInfo, {
            moduleName,
            isWatch,
            isProd,
            publicPath,
            finalPath: mInfo.pagePath,
            incss: inlineCss,
            moduleDir: mInfo.moduleRoot, // 当前模块的路径 jsEntry是相对该目录的
            srcDir: path.join(smtConfInfo.smtClientDir, clientInfo.sourceDir), // 项目的源代码目录
            clientNodeModules: path.join(smtConfInfo.smtClientDir, './node_modules'),
            assetDir: clientInfo.assetsDir,
            sassIncludePath: clientInfo.common.sassIncludePaths,
            distDir,
            manifestDir: util.getManifestConfDir(smtConfInfo),
            commonJSName: clientInfo.commonJSName || 'manifest-commonDll.json',
            commonCssName: clientInfo.commonCSSName || 'manifest-commonCss.json',
            cssModulesTypings: clientInfo.cssModulesTypings,
        }, clientInfo);
    }
    const widgetInfo = wpUtil.findWidet(smtConfInfo, {
        moduleName,
        isWatch,
        isProd,
        publicPath,
        widgetPath: mInfo.widgetPath,
        incss: inlineCss,
    }, clientInfo);

    moduleInfos.entry = moduleInfos.entry.concat(tplInfo.entry);
    moduleInfos.noEntry = moduleInfos.noEntry.concat(tplInfo.noEntry);

    moduleInfos.entry = moduleInfos.entry.concat(widgetInfo.entry);
    moduleInfos.noEntry = moduleInfos.noEntry.concat(widgetInfo.noEntry);

    const watchLists = wpUtil.execBuildNoEntryPage(moduleInfos, smtConfInfo);
    wpUtil.watchNoEntryTpl(watchLists, {
        distDir: path.join(distDir, clientInfo.module.viewsDir),
        srcDir: path.join(smtConfInfo.smtClientDir, clientInfo.sourceDir),
    });

    wpUtil.execBuildPage(moduleInfos, {
        moduleName,
        pageName,
        noLoading,
    }, smtConfInfo, onEnd);
}

function bundelSeq(opts, piKeys, pmoduleInfo, smtConfInfo, clientInfo, onEnd) {
    if (piKeys.length < 1) {
        onEnd();
        return;
    }
    const moduleName = piKeys.shift();
    bundleModule(moduleName, pmoduleInfo, smtConfInfo, clientInfo, opts, () => {
        bundelSeq(opts, piKeys, pmoduleInfo, smtConfInfo, clientInfo, onEnd);
    });
}

function bundleSource(opts) {
    const smtConfInfo = getLeeekConfigInfo();
    const clientInfo = Object.assign({}, conf.client, smtConfInfo.smtConfData.client);
    if (opts.m === 'dll' || opts.module === 'dll') {
        bundleDll(smtConfInfo, clientInfo, opts);
        return;
    }
    const pmoduleInfo = wpUtil.getModuleInfos(clientInfo, smtConfInfo);
    const moduleName = opts.m || opts.module;
    if (_.isString(moduleName) && moduleName) {
        if (moduleName === 'all') {
            // 编译全部模块
            bundleDll(smtConfInfo, clientInfo, opts, () => {
                const piKeys = Object.keys(pmoduleInfo);
                bundelSeq(opts, piKeys, pmoduleInfo, smtConfInfo, clientInfo, () => {
                    print.out(conf.text.bundle.all.endComplie);
                });
            });
        } else {
            bundleModule(moduleName, pmoduleInfo, smtConfInfo, clientInfo, opts);
        }
    } else {
        print.out(conf.text.bundle.notFundModule);
    }
}

module.exports = {
    bundleSource,
    checkEnv,
};
