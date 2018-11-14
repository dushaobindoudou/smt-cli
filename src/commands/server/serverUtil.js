

const util = require('../../utils/util');

module.exports = {
    // 获取server
    getServerPackage(smtConf) {
        if (!smtConf) {
            return null;
        }
        return util.getPckageInfo(smtConf.smtServerDir);
    },
    getClientPackage(smtConf) {
        if (!smtConf) {
            return null;
        }
        return util.getPckageInfo(smtConf.smtClientDir);
    },
};
