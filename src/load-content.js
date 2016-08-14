import readCache from "read-cache"

export default function loadContent(filename)
{
  return readCache(filename, "utf-8")
}
