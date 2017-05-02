import path from "path"
import assign from "object-assign"
import postcss from "postcss"
import { get } from "lodash"

import resolveId from "./resolve-id"
import loadContent from "./load-content"
import parseStatements from "./parse-statements"
import promiseEach from "promise-each"

var URL_RE = /^(?:[a-z]+:)?\/\//i

function SmartImport(options)
{
  options = assign({
    root: process.cwd(),
    path: [],
    skipDuplicates: true,
    resolve: resolveId,
    load: loadContent,
    plugins: []
  }, options)

  options.root = path.resolve(options.root)

  // convert string to an array of a single element
  if (typeof options.path === "string")
    options.path = [ options.path ]

  if (!Array.isArray(options.path))
    options.path = []

  options.path = options.path.map((possibleRelativePath) =>
    path.resolve(options.root, possibleRelativePath)
  )

  return function(styles, result)
  {
    var state = {
      importedFiles: {},
      hashFiles: {}
    }

    var fileName = get(styles, "source.input.file")
    if (fileName)
      state.importedFiles[fileName] = {}

    if (options.plugins && !Array.isArray(options.plugins))
      throw new Error("plugins option must be an array")

    return parseStyles(result, styles, options, state, [])
      .then((bundle) => {
        applyRaws(bundle)
        applyStyles(bundle, styles)

        if (typeof options.onImport === "function")
          options.onImport(Object.keys(state.importedFiles))
      })
  }
}

function applyRaws(bundle)
{
  bundle.forEach((stmt, index) =>
  {
    if (index === 0)
      return

    if (stmt.parent)
    {
      var before = stmt.parent.node.raws.before
      if (stmt.type === "nodes")
        stmt.nodes[0].raws.before = before
      else
        stmt.node.raws.before = before
    }
    else if (stmt.type === "nodes")
    {
      stmt.nodes[0].raws.before = stmt.nodes[0].raws.before || "\n"
    }
  })
}

function applyStyles(bundle, styles)
{
  styles.nodes = []

  bundle.forEach((stmt) =>
  {
    if (stmt.type === "import")
    {
      stmt.node.parent = undefined
      styles.append(stmt.node)
    }
    else if (stmt.type === "media")
    {
      stmt.node.parent = undefined
      styles.append(stmt.node)
    }
    else if (stmt.type === "nodes")
    {
      stmt.nodes.forEach((node) => {
        node.parent = undefined
        styles.append(node)
      })
    }
  })
}

function parseStyles(result, styles, options, state, media)
{
  var statements = parseStatements(result, styles)

  return Promise.resolve(statements).then(promiseEach((stmt) => {
    // skip protocol base uri (protocol://url) or protocol-relative
    if (stmt.type !== "import" || (!options.resolveUrls && URL_RE.test(stmt.uri)))
      return null
    else
      return resolveImportId(result, stmt, options, state)
  }))
    .then(() => {
      var imports = []
      var bundle = []

      // squash statements and their children
      statements.forEach((stmt) =>
      {
        if (stmt.type === "import")
        {
          if (stmt.children)
          {
            stmt.children.forEach((child, index) =>
            {
              if (child.type === "import")
                imports.push(child)
              else
                bundle.push(child)

              // For better output
              if (index === 0)
                child.parent = stmt
            })
          }
          else
          {
            imports.push(stmt)
          }
        }
        else if (stmt.type === "media" || stmt.type === "nodes")
        {
          bundle.push(stmt)
        }
      })

      return imports.concat(bundle)
    })
}

function resolveImportId(result, stmt, options, state)
{
  var atRule = stmt.node
  var sourceFile = get(atRule, "source.input.file")
  var sourcePath = options.resolveUrls && URL_RE.test(sourceFile) ? sourceFile : path.dirname(sourceFile)
  var base = sourceFile ? sourcePath : options.root

  return Promise.resolve(options.resolve(stmt.uri, base, options))
    .then((resolved) => {
      if (!Array.isArray(resolved))
        resolved = [ resolved ]

      // Add dependency messages:
      resolved.forEach((fileName) => {
        result.messages.push({
          type: "dependency",
          file: fileName,
          parent: sourceFile
        })
      })

      return Promise.all(resolved.map((file) =>
         loadImportContent(
           result,
           stmt,
           file,
           options,
           state
        )
      ))
    })
    .then((importedContent) => {
      // Merge loaded statements
      stmt.children = importedContent.reduce((currentContent, statements) => {
        if (statements) {
          currentContent = currentContent.concat(statements)
        }
        return currentContent
      }, [])
    })
    .catch((err) => {
      result.warn(err.message, { node: atRule })
    })
}

function loadImportContent(result, stmt, filename, options, state)
{
  var atRule = stmt.node
  if (options.skipDuplicates)
  {
    // skip files already imported at the same scope
    if (state.importedFiles[filename])
      return null

    // save imported files to skip them next time
    state.importedFiles[filename] = true
  }

  return Promise.resolve(options.load(filename, options))
    .then((content) => {
      if (typeof options.transform !== "function") {
        return content
      }
      return Promise.resolve(options.transform(content, filename, options))
        .then((transformed) =>
         typeof transformed === "string" ? transformed : content
      )
    })
    .then((content) => {
      if (content.trim() === "")
      {
        result.warn(filename + " is empty", { node: atRule })
        return null
      }

      // skip previous imported files not containing @import rules
      if (state.hashFiles[content])
        return null

      return postcss(options.plugins).process(content, {
        from: filename,
        syntax: result.opts.syntax,
        parser: result.opts.parser
      })
        .then((importedResult) =>
        {
          var styles = importedResult.root
          result.messages = result.messages.concat(importedResult.messages)

          if (options.skipDuplicates)
          {
            var hasImport = styles.some((child) =>
              child.type === "atrule" && child.name === "import"
            )

            if (!hasImport)
              state.hashFiles[content] = true
          }

          // recursion: import @import from imported file
          return parseStyles(result, styles, options, state)
        })
    })
}

export default postcss.plugin("postcss-smart-import", SmartImport)
