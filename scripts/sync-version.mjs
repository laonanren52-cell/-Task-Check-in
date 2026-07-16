import { readFile, writeFile } from 'node:fs/promises'

const configPath = new URL('../src-tauri/tauri.conf.json', import.meta.url)
const packagePath = new URL('../package.json', import.meta.url)
const lockPath = new URL('../package-lock.json', import.meta.url)
const cargoPath = new URL('../src-tauri/Cargo.toml', import.meta.url)
const config = JSON.parse(await readFile(configPath, 'utf8'))
const version = config.version

if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`tauri.conf.json 中的版本号不是 MAJOR.MINOR.PATCH：${version}`)

const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
packageJson.version = version
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

const packageLock = JSON.parse(await readFile(lockPath, 'utf8'))
packageLock.version = version
if (packageLock.packages?.['']) packageLock.packages[''].version = version
await writeFile(lockPath, `${JSON.stringify(packageLock, null, 2)}\n`)

const cargo = await readFile(cargoPath, 'utf8')
await writeFile(cargoPath, cargo.replace(/(\[package\][\s\S]*?\nversion\s*=\s*)"[^"]+"/, `$1"${version}"`))
console.log(`SummerFlow 版本已同步为 ${version}`)
