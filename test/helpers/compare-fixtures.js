import fs from "fs"
import postcss from "postcss"
import assign from "object-assign"

import atImport from "../../src"

function read(name) {
  return fs.readFileSync("fixtures/" + name + ".css", "utf8")
}

module.exports = function(t, name, opts, postcssOpts, warnings)
{
  opts = assign({ path: "fixtures/imports" }, opts)
  return postcss(atImport(opts))
    .process(read(name), postcssOpts || {})
    .then((result) => {
      var actual = result.css
      var expected = read(name + ".expected")

      // handy thing: checkout actual in the *.actual.css file
      fs.writeFile("fixtures/" + name + ".actual.css", actual)
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
}
