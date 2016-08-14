import test from "ava"
import compareFixtures from "./helpers/compare-fixtures"

test.serial("should accept content",
  (t) => compareFixtures(t, "custom-load", {
    load: () =>
      "custom-content {}"
  })
)

test.serial("should accept promised content",
  (t) => compareFixtures(t, "custom-load", {
    load: () =>
      Promise.resolve("custom-content {}")
  })
)
