import readCache from "read-cache"

export default function loadContent(fileName) {
  return readCache(fileName, "utf-8")
}
