const fs = require('fs')
const extraFileName = process.argv[2]
const mainFileName = process.argv[3]

const extra = JSON.parse(fs.readFileSync(mainFileName))
const main = JSON.parse(fs.readFileSync(extraFileName))
for (let k in extra) {
  main[k] = extra[k]
}
fs.writeFileSync(mainFileName, JSON.stringify(main, null, 2))
