import Parse from "parse/dist/parse.min.js";

function getMetaContent(name: string, defaultValue: string): string {
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    return defaultValue;
  }
  const content = meta.getAttribute("content");

  if (
    !content ||
    content === "APP_ID_TO_BE_ADDED" ||
    content === "PARSE_SERVER_URL_TO_BE_ADDED"
  ) {
    return defaultValue;
  }

  return content;
}

const defaultAppId = "appid";
const defaultServerUrl = "http://localhost:8085/api";

const appId = getMetaContent("parse-app-id", defaultAppId);
const jsKey = getMetaContent("parse-javascript-key", "");
const serverUrl = getMetaContent("parse-server-url", defaultServerUrl);

Parse.initialize(appId, jsKey);
Parse.serverURL = serverUrl;

export default Parse;
