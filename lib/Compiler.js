const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

class Compiler {
  constructor(config) {
    this.config = config
    this.modules = {}
    this.workspace = process.cwd()
    this.template = null
  }

  // 获取每个文件的依赖和 loader 后的源码
  getModuleInfo(modulePath) {
    const raw = fs.readFileSync(path.join(this.workspace, modulePath), { encoding: 'utf-8' })

    const dependencies = []
    const ast = parser.parse(raw)
    traverse(ast, {
      CallExpression({ node }) {
        if (node.callee.name === 'require') {
          const value = node.arguments[0].value
          const dependency = './' + path.join(modulePath, '..', value)

          node.callee.name = '__webpack_require__'
          node.arguments = [t.stringLiteral(dependency)]

          dependencies.push(dependency)
        }
      }
    })
    const code = generator(ast).code

    return {
      resource: code,
      dependencies
    }
  }

  // 递归收集 module
  buildModule(modulePath) {
    const { resource, dependencies } = this.getModuleInfo(modulePath)

    this.modules[modulePath] = resource

    dependencies.forEach(dependency => {
      this.buildModule(dependency)
    })
  }

  // 注入运行时的模板
  injectTemplate() {
    const injectedModules = Object.entries(this.modules).reduce((pre, cur) => {
      const [key, value] = cur
      pre += `
        "${key}": function(module, exports, __webpack_require__) {
          ${value}
        },`
      return pre
    }, '')

    this.output = `
      (function(modules){
        const installedModules = {}

        function __webpack_require__(moduleId) {
          if (installedModules[moduleId]) {
            return installedModules[moduleId].exports
          }

          const module = installedModules[moduleId] = {
            id: moduleId,
            l: false,
            exports: {}
          }

          modules[moduleId].call(module.exports, module, module.exports, __webpack_require__)

          module.l = true

          return module.exports
        }

        __webpack_require__(__webpack_require__.s = "${this.entry}")
      })({${injectedModules}})
    `
  }

  emit() {
    const { path: outputPath, filename } = this.config.output

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath)
    }

    fs.writeFileSync(path.join(outputPath, filename),  this.output)
  }

  run() {
    const entry = './' + path.relative(this.workspace, this.config.entry).replace(/\\/g, '/')
    this.entry = entry
    this.buildModule(entry)
    this.injectTemplate()
    this.emit()
  }
}

module.exports = Compiler