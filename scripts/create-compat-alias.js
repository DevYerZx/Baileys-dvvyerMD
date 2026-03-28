"use strict"

const fs = require("fs")
const path = require("path")

const PKG_NAME = "@dvyer/baileys"
const COMPAT_NAME = "@whiskeysockets/baileys"

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true })
}

const safeUnlink = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    return
  }

  const stat = fs.lstatSync(targetPath)
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.rmSync(targetPath, { recursive: true, force: true })
  } else {
    fs.unlinkSync(targetPath)
  }
}

const writeProxyPackage = (targetDir) => {
  ensureDir(targetDir)
  const packageJson = {
    name: COMPAT_NAME,
    private: true,
    main: "index.js",
    type: "commonjs"
  }

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  )

  fs.writeFileSync(
    path.join(targetDir, "index.js"),
    `module.exports = require("${PKG_NAME}")\n`,
    "utf8"
  )
}

const createCompatAlias = () => {
  // .../node_modules/@dvyer/baileys/scripts/create-compat-alias.js
  const packageRoot = path.resolve(__dirname, "..")
  const scopeDir = path.dirname(packageRoot) // .../node_modules/@dvyer
  const nodeModulesDir = path.dirname(scopeDir) // .../node_modules
  const compatScopeDir = path.join(nodeModulesDir, "@whiskeysockets")
  const compatDir = path.join(compatScopeDir, "baileys")

  // If real package already installed, do nothing.
  if (fs.existsSync(compatDir) && !fs.lstatSync(compatDir).isSymbolicLink()) {
    return
  }

  ensureDir(compatScopeDir)
  safeUnlink(compatDir)

  // Prefer symlink for zero-copy compatibility
  const relativeTarget = path.relative(compatScopeDir, packageRoot)
  try {
    fs.symlinkSync(relativeTarget, compatDir, "dir")
    return
  } catch {
    // Fallback to tiny proxy package if symlink is not allowed
    writeProxyPackage(compatDir)
  }
}

try {
  createCompatAlias()
} catch (error) {
  // Never fail install because of compatibility alias
  console.warn("[dvyer-baileys] compatibility alias setup skipped:", error?.message || error)
}
