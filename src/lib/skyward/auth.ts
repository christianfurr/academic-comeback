import { SkywardError, type SkywardSession } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = "skyward-calcu/0.1 (+https://github.com/christianfurr/calcu)";

function parseSetCookie(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  // Node 19+: getSetCookie returns one entry per Set-Cookie header.
  const raw =
    typeof (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : headers.get("set-cookie")?.split(/,(?=[^;]+?=)/) ?? [];
  for (const line of raw) {
    const semi = line.indexOf(";");
    const pair = semi === -1 ? line : line.slice(0, semi);
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

function mergeCookies(prev: string, incoming: Record<string, string>): string {
  const jar: Record<string, string> = {};
  if (prev) {
    for (const part of prev.split(";")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      jar[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  }
  for (const [k, v] of Object.entries(incoming)) jar[k] = v;
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export async function skywardFetch(
  url: string,
  init: RequestInit & { cookies?: string; timeoutMs?: number } = {},
): Promise<{ status: number; text: string; cookies: string }> {
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers ?? {});
    headers.set("User-Agent", USER_AGENT);
    headers.set("Accept-Language", "en-US,en;q=0.9");
    if (init.cookies) headers.set("Cookie", init.cookies);
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await res.text();
    const setCookies = parseSetCookie(res.headers);
    const cookies = mergeCookies(init.cookies ?? "", setCookies);
    return { status: res.status, text, cookies };
  } finally {
    clearTimeout(t);
  }
}

function parseLoginTokens(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SkywardError("auth", "Empty login response from Skyward (possible transient failure)");
  }
  if (/invalid login/i.test(trimmed)) {
    throw new SkywardError("auth", "Invalid Skyward username or password");
  }
  if (!trimmed.includes("<li>")) {
    throw new SkywardError("auth", `Unexpected login response shape: ${trimmed.slice(0, 200)}`);
  }
  const inner = trimmed.replace(/<li>/g, "").replace(/<\/li>/g, "").trim();
  const tokens = inner.split("^");
  if (tokens.length < 15) {
    throw new SkywardError(
      "auth",
      `Malformed login token string (${tokens.length} parts): ${trimmed.slice(0, 200)}`,
    );
  }
  return tokens;
}

function formBody(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) params.append(k, v);
  return params.toString();
}

export async function login(
  rawBaseUrl: string,
  username: string,
  password: string,
): Promise<SkywardSession> {
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const loginPayload = {
    requestAction: "eel",
    codeType: "tryLogin",
    codeValue: username,
    login: username,
    password,
  };

  let r1;
  try {
    r1 = await skywardFetch(`${baseUrl}/skyporthttp.w`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody(loginPayload),
    });
  } catch (e: unknown) {
    throw new SkywardError("network", `Network error contacting Skyward: ${String(e)}`);
  }
  if (r1.status !== 200) {
    throw new SkywardError("auth", `Login POST returned HTTP ${r1.status}`);
  }

  const tokens = parseLoginTokens(r1.text);
  const params = {
    dwd: tokens[0],
    "web-data-recid": tokens[1],
    "wfaacl-recid": tokens[2],
    wfaacl: tokens[3],
    nameid: tokens[4],
    duserid: tokens[5],
    "User-Type": tokens[6],
    enc: tokens[13],
  };
  const encses = tokens[14];
  // Skyward joins the two recids with a literal 0x15 (NAK) byte.
  const SEP = String.fromCharCode(0x15);
  const sessionid = `${tokens[1]}${SEP}${tokens[2]}`;
  const nextUrlPath = tokens[7] || "sfhome01.w";

  const finalizePayload = { ...params, encses, sessionid };
  let r2;
  try {
    r2 = await skywardFetch(`${baseUrl}/${nextUrlPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody(finalizePayload),
      cookies: r1.cookies,
    });
  } catch (e: unknown) {
    throw new SkywardError("network", `Network error finalizing session: ${String(e)}`);
  }
  if (r2.status !== 200) {
    throw new SkywardError("auth", `Session-finalize POST returned HTTP ${r2.status}`);
  }
  if (r2.text.length < 500 && /invalid/i.test(r2.text)) {
    throw new SkywardError("auth", "Session finalize rejected by Skyward");
  }

  return {
    baseUrl,
    sessionid,
    encses,
    params,
    cookies: r2.cookies,
  };
}
