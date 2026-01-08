const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const packageJsonPath = path.join(root, 'package.json')
const specPath = path.join(root, 'docs', 'spec.md')
const desktopDocPath = path.join(root, 'docs', 'desktop.md')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const readText = (filePath) => fs.readFileSync(filePath, 'utf8')

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const checkPackageTargets = () => {
  const pkg = readJson(packageJsonPath)
  const build = pkg.build || {}

  assert(build.linux, 'package.json build.linux must be configured')
  assert(!build.mac, 'package.json build.mac must be removed for Linux-only')
  assert(!build.win, 'package.json build.win must be removed for Linux-only')
}

const checkDocs = () => {
  const spec = readText(specPath)
  const desktop = readText(desktopDocPath)

  assert(
    /Linux only\./.test(spec),
    'docs/spec.md must state Linux-only support'
  )
  assert(
    /Build \(Linux\)/.test(desktop),
    'docs/desktop.md must show Linux-only build section'
  )
}

const main = () => {
  checkPackageTargets()
  checkDocs()
  console.log('Linux-only checks passed')
}

main()
