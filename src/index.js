/**
* @Author: dushaobin <smartmesh>
* @Date:   2017-03-28
* @Email:  dushaobin
* @Project: smt-cli
* @Last modified by:   smartmesh
* @Last modified time: 2017-03-31
*/

const init = require('./commands/init');
const debug = require('./commands/debug');
const server = require('./commands/server');
const bundle = require('./commands/bundle');
const contract = require('./commands/contract');


module.exports = {
    init,
    debug,
    server,
    bundle,
    contract,
};
