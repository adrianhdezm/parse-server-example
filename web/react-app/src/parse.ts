import Parse from "parse/dist/parse.min.js";

function getMetaContent(name: string): string {
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    throw new Error(`Meta tag ${name} not found`);
  }
  return meta.getAttribute("content") || "";
}

const appId = getMetaContent("parse-app-id");
const jsKey = getMetaContent("parse-javascript-key");
const serverUrl = getMetaContent("parse-server-url");

Parse.initialize(appId, jsKey);
Parse.serverURL = serverUrl;

export default Parse;
