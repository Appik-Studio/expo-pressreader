import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const packageJsonPath = path.resolve(process.cwd(), 'package.json')

const bumpVersion = async () => {
  const packageJsonContent = await readFile(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent)

  const [major, minor, patch] = packageJson.version.split('.').map(Number)
  const newVersion = `${major}.${minor}.${patch + 1}`
  packageJson.version = newVersion

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

  console.log(`Version bumped to ${newVersion}`)
}

bumpVersion().catch(error => {
  console.error('Error bumping version:', error)
  process.exit(1)
}) 