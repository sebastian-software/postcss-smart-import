import test from "ava"
import compareFixtures from "./helpers/compare-fixtures"
import path from "path"

test.serial("should accept file", (t) =>

   compareFixtures(t, "custom-resolve-file",
     {
       resolve: () =>

       path.resolve("fixtures/imports/custom-resolve-1.css")

     })
)

test.serial("should accept promised file", (t) =>

   compareFixtures(t, "custom-resolve-file",
     {
       resolve: () =>

       Promise.resolve(
        path.resolve("fixtures/imports/custom-resolve-1.css")
      )

     })
)

test.serial("should accept array of files", (t) =>

   compareFixtures(t, "custom-resolve-array",
     {
       resolve: () =>

         [
           path.resolve("fixtures/imports/custom-resolve-1.css"),
           path.resolve("fixtures/imports/custom-resolve-2.css"),
           path.resolve("fixtures/imports/custom-resolve-1.css"),
         ]

     })
)

test.serial("should accept promised array of files", (t) =>

   compareFixtures(t, "custom-resolve-array",
     {
       resolve: () =>

       Promise.resolve([
         path.resolve("fixtures/imports/custom-resolve-1.css"),
         path.resolve("fixtures/imports/custom-resolve-2.css"),
         path.resolve("fixtures/imports/custom-resolve-1.css"),
       ])

     })
)
