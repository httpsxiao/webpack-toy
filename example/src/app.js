const a = require('./js/a.js')
const b = require('./js/b.js')

require('./style/index.css')

const div = document.createElement('div')

div.innerHTML = `
  app<br/>
  ${a.text}<br/>
  ${b.text}<br/>
`

document.body.appendChild(div)
