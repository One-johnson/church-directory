/**
 * =============================================================================
 * DO NOT MODIFY THIS HEADER. This file is deterministic and agent-managed.
 *
 * ImgBB Upload API — Lightweight CDN connector for image storage.
 * =============================================================================
 *
 * Helpers in this module wrap ImgBB's `POST https://api.imgbb.com/1/upload`
 * endpoint. Images are uploaded to ImgBB and the resulting permalink is stored
 * in your app (e.g. in SpacetimeDB) instead of raw base64 blobs.
 */

const IMGBB_API_KEY = "secret_cmhnh7acr0000356o4uf8yvo5";

export interface ImgBBUploadOptions {
  /**
   * Optional human-friendly identifier. If omitted ImgBB autogenerates one.
   */
  name?: string;
}

export interface ImgBBUploadFromFileInput extends ImgBBUploadOptions {
  file: File | Blob;
}

export interface ImgBBUploadFromDataUrlInput extends ImgBBUploadOptions {
  dataUrl: string;
}

export interface ImgBBUploadFromUrlInput extends ImgBBUploadOptions {
  imageUrl: string;
}

export interface ImgBBImageMetadata {
  filename: string;
  name: string;
  mime: string;
  extension: string;
  url: string;
}

export interface ImgBBUploadResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: ImgBBImageMetadata;
    thumb: ImgBBImageMetadata;
    medium: ImgBBImageMetadata;
    delete_url?: string;
  };
  success: boolean;
  status: number;
  [key: string]: any;
}

/**
 * Upload a File/Blob directly to ImgBB.
 */
export async function imgbbUploadFile(
  input: ImgBBUploadFromFileInput
): Promise<ImgBBUploadResponse> {
  if (!input?.file) throw new Error("imgbbUploadFile: `file` is required.");
  const form = new FormData();
  appendCommonFields(form, input);
  const safeName = sanitizeFileName(input.name);
  form.append("body[image]", input.file, safeName ?? "upload.png");
  return proxyImgBB(form);
}

/**
 * Upload a base64/data URL string (e.g. canvas export) to ImgBB.
 */
export async function imgbbUploadDataUrl(
  input: ImgBBUploadFromDataUrlInput
): Promise<ImgBBUploadResponse> {
  if (!input?.dataUrl || typeof input.dataUrl !== "string") {
    throw new Error(
      "imgbbUploadDataUrl: `dataUrl` must be a non-empty string."
    );
  }
  const base64 = extractBase64(input.dataUrl);
  const form = new FormData();
  appendCommonFields(form, input);
  form.append("body[image]", base64);
  return proxyImgBB(form);
}

/**
 * Upload an image already hosted elsewhere by providing its URL.
 */
export async function imgbbUploadRemoteUrl(
  input: ImgBBUploadFromUrlInput
): Promise<ImgBBUploadResponse> {
  if (!input?.imageUrl || typeof input.imageUrl !== "string") {
    throw new Error(
      "imgbbUploadRemoteUrl: `imageUrl` must be a non-empty string."
    );
  }
  if (!/^https?:\/\/.+/i.test(input.imageUrl)) {
    throw new Error(
      "imgbbUploadRemoteUrl: `imageUrl` must be an absolute HTTP(S) URL."
    );
  }
  const form = new FormData();
  appendCommonFields(form, input);
  form.append("body[image]", input.imageUrl);
  return proxyImgBB(form);
}

/* ========================================================================== */
/* Internal helpers                                                           */
/* ========================================================================== */

function appendCommonFields(form: FormData, opts: ImgBBUploadOptions): void {
  if (!IMGBB_API_KEY) throw new Error("ImgBB API key unavailable.");
  form.append("body[key]", IMGBB_API_KEY);
  const safeName = sanitizeFileName(opts.name);
  if (safeName) form.append("body[name]", safeName);
}

async function proxyImgBB(form: FormData): Promise<ImgBBUploadResponse> {
  form.append("protocol", "https");
  form.append("origin", "api.imgbb.com");
  form.append("path", "/1/upload");
  form.append("method", "POST");

  const res = await fetch("/api/proxy", { method: "POST", body: form });
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("ImgBB upload failed: unexpected response type.");
  }

  const payload = (await res.json()) as ImgBBUploadResponse | { error?: any };
  if (!(payload as ImgBBUploadResponse)?.success) {
    throw new Error(
      `ImgBB upload error: ${JSON.stringify((payload as any).error ?? payload)}`
    );
  }
  if (!(payload as ImgBBUploadResponse)?.data?.url) {
    throw new Error("ImgBB upload failed: response missing image URL.");
  }
  return payload as ImgBBUploadResponse;
}

function extractBase64(dataUrl: string): string {
  const [, base64] = dataUrl.split(",");
  if (!base64) throw new Error("Invalid data URL: missing base64 payload.");
  return base64.trim();
}

function sanitizeFileName(name?: string): string | undefined {
  if (!name || typeof name !== "string") return undefined;
  const trimmed = name.trim();
  return trimmed ? trimmed.replace(/[^a-z0-9._-]+/gi, "-") : undefined;
}
