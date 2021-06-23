
const path = require('path')
const root = path.join(__dirname, './')

const config = {
    entry : path.join(root, 'src/app.js'),
    output : {
        path : path.join(root, 'dist'),
        filename : 'bundle.js'
    }
}

module.exports = config
