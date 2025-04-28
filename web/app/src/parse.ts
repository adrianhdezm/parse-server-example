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
    content === "PARSE_SERVER_API_URL_TO_BE_ADDED"
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

export const RECORD_CLASS_NAME = "DataStore";
export const RECORD_PROPERTIES =
  "company1, no1, company, tel0, tel1, tel2, tel3, tel, id3, no, mail1, zip1, zip, address1, URL, XML, longitude, latitude, ido, mail, ID, address, keido, lat, lon, geolocation, active, hp1, map, hp0, hp, id1, id2, hpmail1, hpmail2, hpmail, program1, program, download, com2, com";

export default Parse;
