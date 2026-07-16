import { readFile, writeFile } from 'node:fs/promises'

const [input = 'updater-metadata/latest.json', output = input] = process.argv.slice(2)
const latest = JSON.parse(await readFile(input, 'utf8'))
const policy = JSON.parse(await readFile(new URL('../release-metadata.json', import.meta.url), 'utf8'))
const enriched = {
  ...latest,
  minimumSupportedVersion: policy.minimumSupportedVersion,
  mandatory: policy.mandatory,
  releaseNotes: policy.releaseNotes,
  publishedAt: latest.pub_date ?? new Date().toISOString(),
}
await writeFile(output, `${JSON.stringify(enriched, null, 2)}\n`)
console.log(`Updater metadata enriched for ${latest.version}`)
