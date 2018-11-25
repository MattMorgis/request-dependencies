const {URL} = require("url");
const https = require("https");

const packageName = "request";

const getURLForPage = page => {
  // https://github.com/npm/registry/blob/master/docs/REPLICATE-API.md
  const registry = new URL(
    "/registry/_design/app/_view/dependedUpon",
    "https://skimdb.npmjs.com"
  );

  registry.searchParams.set("group_level", "2");
  registry.searchParams.set("startkey", JSON.stringify([packageName]));
  registry.searchParams.set("endkey", JSON.stringify([packageName, {}]));
  registry.searchParams.set("limit", "100");
  registry.searchParams.set("skip", (page * 100).toString());
  registry.searchParams.set("state", "update_after");

  return registry;
};

const getURLForPackage = package => {
  return new URL(
    "/downloads/point/last-month/" + package,
    "https://api.npmjs.org"
  );
};

https.get(getURLForPackage("request").href, async res => {
  let data = "";
  for await (const chunk of res) {
    data += chunk;
  }

  const response = JSON.parse(data);
  console.log(response);
});
