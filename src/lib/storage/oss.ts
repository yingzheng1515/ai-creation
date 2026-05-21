import { createHash, createHmac, randomBytes } from "node:crypto";

type FetchLike = typeof fetch;

export type AssetKind = "image" | "video";

export type OssConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  fetchImpl?: FetchLike;
  now?: () => Date;
  objectAcl?: "private" | "public-read" | "public-read-write";
  prefix?: string;
  publicBaseUrl?: string;
  randomId?: () => string;
};

export type UploadAssetInput = {
  kind: AssetKind;
  prompt: string;
  sourceUrl: string;
};

export type StoredAsset = {
  contentType: string;
  objectKey: string;
  url: string;
};

type OssEnv = Record<string, string | undefined>;

type AssetSource = {
  body: Buffer;
  contentType: string;
};

const DEFAULT_PREFIX = "ai-creation";
const DEFAULT_IMAGE_TYPE = "image/png";
const DEFAULT_VIDEO_TYPE = "video/mp4";
const MAX_ASSET_BYTES = 100 * 1024 * 1024;

function required(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/^https?:\/\//, "").replace(/\/+$/g, "");
}

function encodeObjectKey(objectKey: string): string {
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

function normalizePublicBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed.replace(/\/+$/g, "") : null;
}

function extensionForContentType(contentType: string, kind: AssetKind): string {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  const knownTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };

  return knownTypes[normalized] ?? (kind === "image" ? "png" : "mp4");
}

function defaultContentType(kind: AssetKind): string {
  return kind === "image" ? DEFAULT_IMAGE_TYPE : DEFAULT_VIDEO_TYPE;
}

function buildObjectKey(input: UploadAssetInput, contentType: string, config: OssConfig): string {
  const now = config.now?.() ?? new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const id = config.randomId?.() ?? randomBytes(8).toString("hex");
  const folder = input.kind === "image" ? "images" : "videos";
  const prefix = trimSlashes(config.prefix ?? DEFAULT_PREFIX);
  const extension = extensionForContentType(contentType, input.kind);

  return [prefix, folder, year, month, day, `${id}.${extension}`].filter(Boolean).join("/");
}

function buildPublicUrl(objectKey: string, config: OssConfig): string {
  const encodedKey = encodeObjectKey(objectKey);
  const publicBaseUrl = normalizePublicBaseUrl(config.publicBaseUrl);

  if (publicBaseUrl) {
    return `${publicBaseUrl}/${encodedKey}`;
  }

  return `https://${config.bucket}.${normalizeEndpoint(config.endpoint)}/${encodedKey}`;
}

function isUnsafeHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    /^127\./.test(normalized) ||
    /^10\./.test(normalized) ||
    /^192\.168\./.test(normalized) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

async function sourceFromDataUrl(sourceUrl: string, kind: AssetKind): Promise<AssetSource> {
  const match = /^data:([^;,]+)?;base64,(.+)$/i.exec(sourceUrl);

  if (!match) {
    throw new Error("Data URL asset source is invalid.");
  }

  const body = Buffer.from(match[2], "base64");

  if (body.length > MAX_ASSET_BYTES) {
    throw new Error("Asset is too large to persist to OSS.");
  }

  return {
    body,
    contentType: match[1] || defaultContentType(kind),
  };
}

async function sourceFromHttpsUrl(sourceUrl: string, kind: AssetKind, fetchImpl: FetchLike): Promise<AssetSource> {
  const parsed = new URL(sourceUrl);

  if (parsed.protocol !== "https:" || isUnsafeHost(parsed.hostname)) {
    throw new Error("Only HTTPS or data URLs can be persisted to OSS.");
  }

  const response = await fetchImpl(sourceUrl, {
    method: "GET",
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error("Generated asset download failed.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ASSET_BYTES) {
    throw new Error("Asset is too large to persist to OSS.");
  }

  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > MAX_ASSET_BYTES) {
    throw new Error("Asset is too large to persist to OSS.");
  }

  return {
    body,
    contentType: response.headers.get("content-type") || defaultContentType(kind),
  };
}

async function readAssetSource(input: UploadAssetInput, fetchImpl: FetchLike): Promise<AssetSource> {
  if (input.sourceUrl.startsWith("data:")) {
    return sourceFromDataUrl(input.sourceUrl, input.kind);
  }

  if (!input.sourceUrl.startsWith("https://")) {
    throw new Error("Only HTTPS or data URLs can be persisted to OSS.");
  }

  return sourceFromHttpsUrl(input.sourceUrl, input.kind, fetchImpl);
}

function contentMd5(body: Buffer): string {
  return createHash("md5").update(body).digest("base64");
}

function bodyInitFromBuffer(body: Buffer): ArrayBuffer {
  return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
}

function canonicalizedOssHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .filter(([name]) => name.toLowerCase().startsWith("x-oss-"))
    .map(([name, value]) => [name.toLowerCase(), value.trim()] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}\n`)
    .join("");
}

function ossAuthorization(method: string, objectKey: string, headers: Record<string, string>, config: OssConfig): string {
  const stringToSign = [
    method,
    headers["content-md5"] ?? "",
    headers["content-type"] ?? "",
    headers.date ?? "",
    `${canonicalizedOssHeaders(headers)}/${config.bucket}/${objectKey}`,
  ].join("\n");
  const signature = createHmac("sha1", config.accessKeySecret).update(stringToSign).digest("base64");

  return `OSS ${config.accessKeyId}:${signature}`;
}

export function getOssConfig(env: OssEnv = process.env): OssConfig | null {
  const accessKeyId = required(env.ALIYUN_OSS_ACCESS_KEY_ID);
  const accessKeySecret = required(env.ALIYUN_OSS_ACCESS_KEY_SECRET);
  const bucket = required(env.ALIYUN_OSS_BUCKET);
  const endpoint = required(env.ALIYUN_OSS_ENDPOINT);

  if (!accessKeyId || !accessKeySecret || !bucket || !endpoint) {
    return null;
  }

  const objectAcl = env.ALIYUN_OSS_OBJECT_ACL;

  return {
    accessKeyId,
    accessKeySecret,
    bucket,
    endpoint,
    objectAcl: objectAcl === "private" || objectAcl === "public-read" || objectAcl === "public-read-write" ? objectAcl : undefined,
    prefix: required(env.ALIYUN_OSS_PREFIX) ?? DEFAULT_PREFIX,
    publicBaseUrl: required(env.ALIYUN_OSS_PUBLIC_BASE_URL) ?? undefined,
  };
}

export async function uploadAssetToOss(input: UploadAssetInput, config: OssConfig): Promise<StoredAsset> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const source = await readAssetSource(input, fetchImpl);
  const objectKey = buildObjectKey(input, source.contentType, config);
  const uploadUrl = `https://${config.bucket}.${normalizeEndpoint(config.endpoint)}/${encodeObjectKey(objectKey)}`;
  const headers: Record<string, string> = {
    "content-md5": contentMd5(source.body),
    "content-type": source.contentType,
    date: (config.now?.() ?? new Date()).toUTCString(),
  };

  if (config.objectAcl) {
    headers["x-oss-object-acl"] = config.objectAcl;
  }

  headers.authorization = ossAuthorization("PUT", objectKey, headers, config);

  const response = await fetchImpl(uploadUrl, {
    body: bodyInitFromBuffer(source.body),
    headers,
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("OSS upload failed.");
  }

  return {
    contentType: source.contentType,
    objectKey,
    url: buildPublicUrl(objectKey, config),
  };
}
