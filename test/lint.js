import test from "ava"
import postcss from "postcss"
import atImport from "../src"

const processor = postcss().use(atImport())

test("should warn when not @charset and not @import statement before", (t) =>

   Promise.all([
     processor.process(`a {} @import "";`),
     processor.process(`@media {} @import "";`)
   ])
     .then((results) => {
       results.forEach((result) => {
         const warnings = result.warnings()
         t.is(warnings.length, 1)
         t.is(
           warnings[0].text,
           "@import must precede all other statements (besides @charset)"
      )
       })
     })
)

test("should not warn if comments before @import", (t) =>
  processor.process(`/* skipped comment */ @import "";`)
    .then((result) => {
      const warnings = result.warnings()
      t.is(warnings.length, 1)
      t.is(warnings[0].text, `Unable to find uri in '@import ""'`)
    })
)

test("should warn if something before comments", (t) =>
  processor.process(`a{} /* skipped comment */ @import "";`)
    .then((result) => {
      t.is(result.warnings().length, 1)
    })
)

test("should not warn when @charset or @import statement before", (t) =>
  Promise.all([
    processor.process(`@import "bar.css"; @import "bar.css";`, {
      from: "test/fixtures/imports/foo.css"
    }),
    processor.process(`@charset "bar.css"; @import "bar.css";`, {
      from: "test/fixtures/imports/foo.css"
    })
  ])
    .then((results) => {
      results.forEach((result) =>
      t.is(result.warnings().length, 0)
    )
    })
)

test("should warn when a user didn't close an import with ;", (t) =>
  processor
    .process(`@import url('http://') :root{}`)
    .then((result) => {
      const warnings = result.warnings()
      t.is(warnings.length, 1)
      t.is(
        warnings[0].text,
        "It looks like you didn't end your @import statement correctly. " +
        "Child nodes are attached to it."
        )
    })
)

test("should warn on invalid url", (t) =>
  processor
    .process(`
      @import foo-bar;
      @import ;
      @import '';

      @import "";
      @import url();
      @import url('');
      @import url("");
    `)
    .then((result) => {
      /* eslint-disable no-magic-numbers */
      const warnings = result.warnings()
      t.is(warnings.length, 7)
      t.is(warnings[0].text, `Unable to find uri in '@import foo-bar'`)
      t.is(warnings[1].text, `Unable to find uri in '@import '`)
      t.is(warnings[2].text, `Unable to find uri in '@import '''`)
      t.is(warnings[3].text, `Unable to find uri in '@import ""'`)
      t.is(warnings[4].text, `Unable to find uri in '@import url()'`)
      t.is(warnings[5].text, `Unable to find uri in '@import url('')'`)
      t.is(warnings[6].text, `Unable to find uri in '@import url("")'`)
    })
)

test("should not warn when a user closed an import with ;", (t) =>
  processor
    .process(`@import url('http://');`)
    .then((result) => {
      t.is(result.warnings().length, 0)
    })
)
