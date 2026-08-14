import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ProviderAuthRequiredError, ProviderUnavailableError } from "./contracts.mjs";

const b64url = (value) => Buffer.from(value).toString("base64url");
export function present(value) { return typeof value === "string" && value.trim().length > 0; }

export function appleConfig(env = process.env) {
  return {
    issuerId:env.ASC_ISSUER_ID ?? env.APP_STORE_CONNECT_ISSUER_ID,
    keyId:env.ASC_KEY_ID ?? env.APP_STORE_CONNECT_KEY_ID,
    privateKeyPath:env.ASC_PRIVATE_KEY_PATH ?? env.APP_STORE_CONNECT_PRIVATE_KEY_PATH,
    appId:env.ASC_APP_ID,
    bundleId:env.ASC_BUNDLE_ID ?? "com.xiazishuo.styleatlas",
  };
}

export function searchConsoleConfig(env = process.env) {
  return {
    credentialsPath:env.GOOGLE_APPLICATION_CREDENTIALS,
    accessToken:env.GSC_ACCESS_TOKEN,
    siteUrl:env.GSC_SITE_URL ?? env.SEARCH_CONSOLE_SITE_URL,
  };
}

export function missingAppleConfig(config) {
  return ["ASC_ISSUER_ID","ASC_KEY_ID","ASC_PRIVATE_KEY_PATH"].filter((_, index)=>![config.issuerId,config.keyId,config.privateKeyPath][index]);
}

export function missingSearchConfig(config) {
  const missing=[];
  if (!present(config.siteUrl)) missing.push("GSC_SITE_URL");
  if (!present(config.accessToken) && !present(config.credentialsPath)) missing.push("GOOGLE_APPLICATION_CREDENTIALS or GSC_ACCESS_TOKEN");
  return missing;
}

export async function createAppleToken(config, { now = new Date(), lifetimeSeconds = 600, readFileFn = readFile } = {}) {
  const missing = missingAppleConfig(config);
  if (missing.length) throw new ProviderAuthRequiredError("app_store_connect", missing);
  const privateKey = await readFileFn(config.privateKeyPath, "utf8");
  const issuedAt = Math.floor(now.getTime()/1000);
  const header = b64url(JSON.stringify({ alg:"ES256", kid:config.keyId, typ:"JWT" }));
  const payload = b64url(JSON.stringify({ iss:config.issuerId, iat:issuedAt, exp:issuedAt+Math.min(lifetimeSeconds,1200), aud:"appstoreconnect-v1" }));
  const input = `${header}.${payload}`;
  const signer=createSign("SHA256");signer.update(input);signer.end();
  return `${input}.${signer.sign({key:privateKey,dsaEncoding:"ieee-p1363"}).toString("base64url")}`;
}

export async function createGoogleAccessToken(config, { now = new Date(), fetchFn = fetch, readFileFn = readFile } = {}) {
  if (present(config.accessToken)) return config.accessToken;
  const missing=missingSearchConfig(config);if(missing.length) throw new ProviderAuthRequiredError("search_console",missing);
  let account;
  try { account=JSON.parse(await readFileFn(config.credentialsPath,"utf8")); }
  catch { throw new ProviderUnavailableError("search_console","Credential file cannot be read.",{code:"CREDENTIAL_FILE_UNREADABLE"}); }
  if (!present(account.client_email)||!present(account.private_key)) throw new ProviderUnavailableError("search_console","Credential file is not a service account key.",{code:"CREDENTIAL_FILE_INVALID"});
  const issuedAt=Math.floor(now.getTime()/1000),tokenUrl=account.token_uri??"https://oauth2.googleapis.com/token";
  const header=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=b64url(JSON.stringify({iss:account.client_email,scope:"https://www.googleapis.com/auth/webmasters.readonly",aud:tokenUrl,iat:issuedAt,exp:issuedAt+3600}));
  const input=`${header}.${payload}`;const signer=createSign("RSA-SHA256");signer.update(input);signer.end();
  const assertion=`${input}.${signer.sign(account.private_key).toString("base64url")}`;
  const response=await fetchFn(tokenUrl,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion})});
  if(!response.ok) throw new ProviderUnavailableError("search_console",`OAuth token request failed (${response.status}).`,{code:response.status===401||response.status===403?"AUTH_REJECTED":"TOKEN_REQUEST_FAILED",retryable:response.status>=500||response.status===429});
  const body=await response.json();if(!present(body.access_token)) throw new ProviderUnavailableError("search_console","OAuth response omitted access token.",{code:"TOKEN_RESPONSE_INVALID"});
  return body.access_token;
}
