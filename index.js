const fs = require('fs')
const path = require('path')

const convert = require('xml-js')
const _ = require('lodash')

const Command = {
  ARCHIVE: 'archive',
  UNARCHIVE: 'unarchive'
}

let __files = {}

;(async function main () {
  const [,, command, origin, destiny] = process.argv

  switch (command) {
    case Command.ARCHIVE:
      return archive(origin, destiny)

    case Command.UNARCHIVE:
      return unarchive(origin)

    default:
      throw new Error(`Unexpected command, available options are: ${Object.keys(Command).map(c => Command[c]).join(', ')}`)
  
  }
})()

// given a file represented by its absolute path, returns an alias
// that will be used after to generate a relative path
function archiveFile (absolutePath, counter) {
  if (!__files[absolutePath]) {
    const pretty = _.last(absolutePath.split(/\//g))
    const relativePath = counter > 0
      ? `${pretty} (${counter})`
      : pretty

    const hasConflict = !_.chain(__files)
      .toPairs()
      .filter(([absoulte, relative]) => (relative === relativePath && absoulte !== absolutePath))
      .isEmpty()
      .value()

    if (hasConflict) {
      console.warn(`Detected file name conflict for: ${absolutePath}`)

      return archiveFile(absolutePath, counter + 1)
    }

    __files[absolutePath] = relativePath
  }

  return `__MLT_ARCHIVER_RELATIVE_PATH__${__files[absolutePath]}`
}

function isAlias(sourceDir, item) {
  if (!item.attributes || item.attributes.name !== 'resource') {
    return false
  }

  const element = _.find(item.elements, ({ type }) => type === 'text')
  if (!element) {
    return false
  }

  const t = element.text

  if (!t.match(/MLT_ARCHIVER_RELATIVE_PATH/)) {
    return false
  }

  const relativePath = t.replace('__MLT_ARCHIVER_RELATIVE_PATH__', '')
  const absolutePath = path.join(sourceDir, relativePath)

  if (fs.existsSync(absolutePath)) {
    return absolutePath
  }
}

function isFile(sourceDir, item) {
  if (!item.attributes || item.attributes.name !== 'resource') {
    return false
  }

  const element = _.find(item.elements, ({ type }) => type === 'text')
  if (!element) {
    return false
  }

  const t = element.text

  if (fs.existsSync(t)) {
    return t
  }

  if (fs.existsSync(path.join(sourceDir, t))) {
    return path.join(sourceDir, t)
  }
}

function recursiveMapItem(sourcePath, item) {
  const file = isFile(sourcePath, item)

  if (file) {
    return {
      ...item,
      elements: _.chain(item.elements)
        .filter(({ type }) => type !== 'text')
        .union([{
          type: 'text',
          text: archiveFile(file)
        }])
      .value()
    }
  }

  if (_.isEmpty(item.elements)) {
    return item
  }

  return {
    ...item,
    elements: _.map(item.elements, i => recursiveMapItem(sourcePath, i))
  }
}

function recursivelyRemapItem (sourcePath, item) {
  const file = isAlias(sourcePath, item)

  if (file) {
    return {
      ...item,
      elements: _.chain(item.elements)
      .filter(({ type }) => type !== 'text')
      .union([{
        type: 'text',
        text: file
      }])
      .value()
    }
  }

  if (_.isEmpty(item.elements)) {
    return item
  }

  return {
    ...item,
    elements: _.map(item.elements, i => recursivelyRemapItem(sourcePath, i))
  }
}

function unarchive (filePath) {
  const directory = path.join(filePath, '..')
  const sourceFileName = path.parse(filePath).name
  const xml = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  const content = recursivelyRemapItem(directory, xml)

  fs.writeFileSync(path.join(directory, sourceFileName + '.mlt'), convert.js2xml(content, {
    spaces: 2
  }), 'utf-8')
}

async function archive (origin, destiny) {
  const sourceDirectory = path.join(origin, '..')
  const raw = fs.readFileSync(origin, 'utf-8')

  const xmlContent = convert.xml2js(raw, {
    compact: false
  })

  const content = recursiveMapItem(sourceDirectory, xmlContent)

  for (const absoulte of Object.keys(__files)) {
    const relativePath = path.join(destiny, __files[absoulte])

    console.log(`Copying ${absoulte} to ${relativePath}`)
    await copyFile(absoulte, relativePath)
  
  }

  const filename = path.parse(origin).name + '.mlta'
  const projectFile = path.join(destiny, filename)

  fs.writeFileSync(projectFile, JSON.stringify(content, null, 2), 'utf-8')
}

// aux
function copyFile (from, to) {
  return new Promise((resolve, reject) => {
    fs.copyFile(from, to, err => {
      if (err) return reject(err)

      resolve()
    })
  })
}
