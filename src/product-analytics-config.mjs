import { readFile } from "node:fs/promises";

// Machine-local mapping: never exported to the public dashboard or committed.
// Environment override remains available for hosted runners.
export async function loadYixiuIosStreamId({ env = process.env, readFileFn = readFile } = {}) {
  if (env.YIXIU_IOS_STREAM_ID !== undefined) {
    if (env.YIXIU_IOS_STREAM_ID === "") return null;
    if (!/^\d+$/.test(env.YIXIU_IOS_STREAM_ID)) throw Object.assign(new Error("Invalid iOS stream configuration"), { code: "INVALID_STREAM" });
    return env.YIXIU_IOS_STREAM_ID;
  }
  let config;
  try { config = JSON.parse(await readFileFn(new URL("../config/product-analytics.local.json", import.meta.url), "utf8")); }
  catch (error) {
    if (error.code === "ENOENT") return null;
    throw Object.assign(new Error("Invalid product analytics configuration"), { code: "INVALID_USAGE_CONFIG" });
  }
  const property = String(env.GA4_PROPERTY_ID ?? "").replace(/^properties\//, "");
  if (!property || config.propertyId !== property || typeof config.iosStreamId !== "string" || !/^\d+$/.test(config.iosStreamId)) {
    throw Object.assign(new Error("Product analytics mapping does not match configured GA4 property"), { code: "INVALID_USAGE_CONFIG" });
  }
  return config.iosStreamId;
}
