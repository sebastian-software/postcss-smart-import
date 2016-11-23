import test from "ava"
import postcss from "postcss"
import atImport from "../src"
import { resolve } from "path"
import { readFileSync } from "fs"

test("should have a callback that returns an object containing imported files", (t) =>
   postcss()
    .use(atImport({
      path: "test/fixtures/imports",
      onImport: (files) =>
      {
        t.deepEqual(
          files,
          [
            resolve("test/fixtures/media-import.css"),
            resolve("test/fixtures/imports/media-import-level-2.css"),
            resolve("test/fixtures/imports/media-import-level-3.css"),
          ]
        )
      },
    }))
    .process(readFileSync("test/fixtures/media-import.css"), {
      from: "test/fixtures/media-import.css",
    })
)

test("should have a callback shortcut for webpack", (t) =>
{
  var files = []
  var webpackMock = {
    addDependency: (file) =>
    {
      files.push(file)
    },
  }

  return postcss()
    .use(atImport({
      path: "test/fixtures/imports",
      addDependencyTo: webpackMock,
    }))
    .process(readFileSync("test/fixtures/media-import.css"), {
      from: "test/fixtures/media-import.css",
    })
    .then(() =>
    {
      t.deepEqual(
        files,
        [
          resolve("test/fixtures/media-import.css"),
          resolve("test/fixtures/imports/media-import-level-2.css"),
          resolve("test/fixtures/imports/media-import-level-3.css"),
        ]
      )
    })
})
