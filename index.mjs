import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import argsParser from 'command-line-args'

const trimExtension = path => path.substring(0, path.lastIndexOf('.')) || path

const compile = (srcFilePath) => new Promise((resolve) => {
  exec(`"./bin/sq_static.exe" -o "${srcFilePath}.sq" -c "${srcFilePath}.nut"`, (err, stdErr, stdOutput) => {
    resolve()
  })
})

const processFile = async (srcFilePath, dstFilePath) => {
  const ext = path.extname(srcFilePath)

  switch(ext) {
    case ".nut":
      const srcPathWithoutExt = trimExtension(srcFilePath)
      const dstPathWithoutExt = trimExtension(dstFilePath)
      await compile(srcPathWithoutExt)

      fs.renameSync(srcPathWithoutExt+".sq", dstPathWithoutExt+".sq")
      break
    case ".xml":
      fs.writeFileSync(dstFilePath, fs.readFileSync(srcFilePath, "utf8").replaceAll(".nut", ".sq"))
      break
    default:
      fs.writeFileSync(dstFilePath, fs.readFileSync(srcFilePath))
  }
}

const loop = async (srcDirPath, dstDirPath) => {
  const entries = fs.readdirSync(srcDirPath)

  for(let i = 0; i < entries.length; ++i) {
    const srcChildPath = srcDirPath + "\\" + entries[i]
    const dstChildPath = dstDirPath +"\\" + entries[i]

    if (fs.lstatSync(srcChildPath).isDirectory()) {
      if (!fs.existsSync(dstChildPath)) {
        fs.mkdirSync(dstChildPath)
      }

      await loop(srcChildPath, dstChildPath)
    } else {
      await processFile(srcChildPath, dstChildPath)
    }
  }
}

const optionDefinitions = [
  { name: 'src', type: String },
  { name: 'dst', type: String },
]

const args = argsParser(optionDefinitions)

const srcDirPath = path.resolve(args.src)
const dstDirPath = path.resolve(args.dst)

if (!srcDirPath) {
  throw new Error("Invalid src argument")
}

if (!dstDirPath) {
  throw new Error("Invalid dst argument")
}

loop(srcDirPath, dstDirPath)
