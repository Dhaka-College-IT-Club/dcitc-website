import { createApp } from "../src/app.js";

export type ApiResponse = {
  status: number;
  body: any;
  setCookies: string[];
  headers: Headers;
};

export class Client {
  cookie = "";

  constructor(private readonly baseUrl: string) {}

  async req(
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
  ): Promise<ApiResponse> {
    const headers: Record<string, string> = { ...init.headers };
    if (init.body !== undefined) headers["content-type"] = "application/json";
    if (this.cookie) headers.cookie = this.cookie;

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      redirect: "manual",
    });

    const setCookies = response.headers.getSetCookie();
    this.merge(setCookies);
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: response.status, body, setCookies, headers: response.headers };
  }

  private merge(setCookies: string[]): void {
    const jar = new Map<string, string>();
    for (const pair of this.cookie.split(";").map((v) => v.trim()).filter(Boolean)) {
      const index = pair.indexOf("=");
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
    for (const raw of setCookies) {
      const [pair] = raw.split(";");
      const index = pair!.indexOf("=");
      const name = pair!.slice(0, index);
      const value = pair!.slice(index + 1);
      if (!value || /max-age=0/i.test(raw) || /expires=thu, 01 jan 1970/i.test(raw)) jar.delete(name);
      else jar.set(name, value);
    }
    this.cookie = [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

export async function startServer(): Promise<{ client: Client; baseUrl: string; close: () => Promise<void> }> {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    client: new Client(baseUrl),
    baseUrl,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
