const path = require('path')
const workspace = process.cwd()
const config = require(path.join(workspace, 'webpack.config.js'))
const Compiler = require('./Compiler')

const compiler = new Compiler(config)

compiler.run()
