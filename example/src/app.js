const moduleA = require('./moduleA.js')

const div = document.createElement('div')

div.innerHTML = 'app ' + moduleA.name


document.body.appendChild(div)