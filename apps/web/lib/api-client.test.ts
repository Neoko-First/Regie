import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, ApiError } from "./api-client";

/** Réponse JSON simulée. */
function json(status: number, body: unknown = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Simule le BFF : renvoie les réponses prévues pour chaque URL, dans l'ordre. */
function mockFetch(routes: Record<string, Response[]>) {
  const fetchMock = vi.fn(async (url: string) => {
    const response = routes[url]?.shift();
    if (!response) throw new Error(`Appel inattendu : ${url}`);
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiClient", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { location: { pathname: "/changes", search: "?vue=board", assign } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    assign.mockReset();
  });

  it("rafraîchit la session sur un 401 puis rejoue la requête", async () => {
    const fetchMock = mockFetch({
      "/api/auth/me": [json(401), json(200, { id: "u1" })],
      "/api/auth/refresh": [json(204)],
    });
    await expect(apiClient.get("/auth/me")).resolves.toEqual({ id: "u1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ne lance qu'un seul refresh pour des requêtes simultanées", async () => {
    const fetchMock = mockFetch({
      "/api/a": [json(401), json(200, "a")],
      "/api/b": [json(401), json(200, "b")],
      "/api/auth/refresh": [json(204)],
    });
    await expect(Promise.all([apiClient.get("/a"), apiClient.get("/b")])).resolves.toEqual([
      "a",
      "b",
    ]);
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh");
    expect(refreshCalls).toHaveLength(1);
  });

  it("renvoie vers la connexion, avec la page courante, si le refresh échoue", async () => {
    mockFetch({
      "/api/auth/me": [json(401, { code: "UNAUTHENTICATED", message: "Session expirée" })],
      "/api/auth/refresh": [json(401)],
    });
    await expect(apiClient.get("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith("/login?next=%2Fchanges%3Fvue%3Dboard");
  });

  it("ne tente pas de refresh sur un échec de connexion", async () => {
    const fetchMock = mockFetch({
      "/api/auth/login": [
        json(401, { code: "UNAUTHENTICATED", message: "Identifiants incorrects." }),
      ],
    });
    await expect(apiClient.post("/auth/login", {})).rejects.toMatchObject({
      status: 401,
      message: "Identifiants incorrects.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it("normalise une coupure réseau", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiClient.get("/auth/me")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
