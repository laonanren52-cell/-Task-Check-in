import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const config = JSON.parse(await readFile(new URL('src-tauri/tauri.conf.json', root), 'utf8'))
const cargo = await readFile(new URL('src-tauri/Cargo.toml', root), 'utf8')
const cargoVersion = cargo.match(/\[package\][\s\S]*?\nversion\s*=\s*"([^"]+)"/)?.[1]

if (!/^\d+\.\d+\.\d+$/.test(config.version)) throw new Error('Tauri 版本号必须使用 MAJOR.MINOR.PATCH')
if (pkg.version !== config.version || cargoVersion !== config.version) throw new Error(`版本不一致：package=${pkg.version} cargo=${cargoVersion} tauri=${config.version}`)
if (config.identifier !== 'com.summerflow.studytracker') throw new Error('应用 identifier 被修改，已停止发布')
if (!config.plugins?.updater?.pubkey || !config.plugins?.updater?.endpoints?.length) throw new Error('Updater 公钥或 endpoint 未配置')
if (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== `v${config.version}`) throw new Error(`Tag ${process.env.GITHUB_REF_NAME} 与应用版本 v${config.version} 不一致`)
for (const unsafe of ['summerflow.key', 'summerflow.password', '.tauri/summerflow.key']) {
  if (existsSync(new URL(unsafe, root))) throw new Error(`仓库中发现敏感文件：${unsafe}`)
}
console.log(`Release check passed: SummerFlow ${config.version}`)
