const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const parser = require('xml2json')

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

function isFile (sourceDir, entry) {
  if (entry.name !== 'resource') {
    return false
  }


  const t = entry['$t']
  if (fs.existsSync(t)) {
    return t
  }


  if (fs.existsSync(path.join(sourceDir, t))) {
    return path.join(sourceDir, t)
  }


  //return entry.name === 'resource' && fs.existsSync(entry['$t'])
}

function isAlias (dir, entry) {
  if (entry.name !== 'resource') {
    return false
  }

  const t = entry['$t']

  if (!t.match(/MLT_ARCHIVER_RELATIVE_PATH/)) {
    return false
  }

  const relativePath = t.replace('__MLT_ARCHIVER_RELATIVE_PATH__', '')
  const absolutePath = path.join(dir, relativePath)

  if (fs.existsSync(absolutePath)) {
    return absolutePath
  }

}

function mapProducer (sourceDirectory, producer) {
  const { property } = producer

  return {
    ...producer,
    property: property.map(entry => {
      const file = isFile(sourceDirectory, entry)
      if (file) {

        // sorry for the side effect 🌈
        entry['$t'] = archiveFile(file)
      }

      return entry
    })
  
  }
}

function remapProducer (relative, producer) {
  const { property } = producer

  return {
    ...producer,
    property: property.map(entry => {
      if (isAlias(relative, entry)) {
        entry['$t'] = isAlias(relative, entry)
      }

      return entry
    })
  
  }


}

function unarchive (filePath) {
  const directory = path.join(filePath, '..')
  console.log(directory)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const content = JSON.parse(raw)

  content.mlt.producer = content.mlt.producer
    .map(entry => typeof(entry) === 'object'
      ? remapProducer(directory, entry)
      : entry)

  fs.writeFileSync(path.join(directory, 'project.mlt'), parser.toXml(JSON.stringify(content)), 'utf-8')


}

async function archive (origin, destiny) {

  const sourceDirectory = path.join(origin, '..')
  const raw = fs.readFileSync(origin, 'utf-8')
  const content = JSON.parse(parser.toJson(raw))

  content.mlt.producer = content.mlt.producer
    .map(entry => typeof(entry) === 'object'
      ? mapProducer(sourceDirectory, entry)
      : entry)

  for (const absoulte of Object.keys(__files)) {
    const relativePath = path.join(destiny, __files[absoulte])

    console.log(`Copying ${absoulte} to ${relativePath}`)
    await copyFile(absoulte, relativePath)
  
  }

  const projectFile = path.join(destiny, 'project.mlta')
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
