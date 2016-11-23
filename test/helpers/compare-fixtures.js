import fs from "fs"
import postcss from "postcss"
import assign from "object-assign"

import atImport from "../../src"

function read(name) {
  return fs.readFileSync("test/fixtures/" + name + ".css", "utf8")
}

export default function(t, name, opts, postcssOpts, warnings)
{
  opts = assign({ path: "test/fixtures/imports" }, opts)
  return postcss(atImport(opts))
    .process(read(name), postcssOpts || {})
    .then((result) => {
      var actual = result.css
      var expected = read(name + ".expected")

      // handy thing: checkout actual in the *.actual.css file
      fs.writeFile("test/fixtures/" + name + ".actual.css", actual, () => {
        t.is(actual, expected)

        if (!warnings)
          warnings = []

        result.warnings().forEach((warning, index) => {
          t.is(
            warning.text,
            warnings[index],
            "unexpected warning: \"" + warning.text + "\""
          )
        })
      })
    })
}
