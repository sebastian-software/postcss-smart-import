import test from "ava"
import postcss from "postcss"
import scss from "postcss-scss"
import atImport from "../src"
import compareFixtures from "./helpers/compare-fixtures"

test("should apply plugins to root", (t) =>
{
  const atRules = []
  const rules = []
  return compareFixtures(t, "plugins", {
    plugins: [
      (css) =>
      {
        css.walk((node) =>
        {
          if (node.type === "rule")
          {
            rules.push(node.selector)
            if (node.selector === "bar")
              node.remove()
            else
              node.selector += "-converted"
          }

          if (node.type === "atrule")
            atRules.push(node.name)
        })
      },
    ],
  })
  .then(() =>
  {
    t.deepEqual(atRules, [ "import" ])
    t.deepEqual(rules.sort(), [ "bar", "foo" ].sort())
  })
})

test("should error when value is not an array", (t) =>
  postcss()
    .use(atImport({
      plugins: "foo",
    }))
    .process("")
    .catch((error) =>
    {
      t.is(error.message, "plugins option must be an array")
    })
)

test("should remain silent when value is an empty array", () =>
  postcss()
    .use(atImport({
      plugins: [],
    }))
    .process("")
)

test("should process custom syntax", (t) =>
  compareFixtures(t, "scss-syntax", null, {
    syntax: scss,
  })
)

test("should process custom syntax by parser", (t) =>
  compareFixtures(t, "scss-parser", null, {
    parser: scss,
  })
)
