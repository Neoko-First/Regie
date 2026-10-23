import { type ArgumentsHost, HttpStatus, Logger, NotFoundException } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { type ApiErrorBody, ErrorCode, z } from "@regie/shared";
import { ZodValidationException } from "nestjs-zod";
import { Prisma } from "../../generated/prisma/client";
import { AppException } from "../errors/app.exception";
import { AllExceptionsFilter } from "./all-exceptions.filter";

/** Exécute le filtre et renvoie le statut et le corps de la réponse produite. */
function run(exception: unknown): { status: number; body: ApiErrorBody } {
  const result = { status: 0, body: {} as ApiErrorBody };
  const response = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: ApiErrorBody) {
      result.body = body;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return result;
}

describe("AllExceptionsFilter", () => {
  beforeAll(() => {
    // Les erreurs inattendues sont journalisées : on évite de polluer la sortie des tests
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  it("renvoie le détail par champ d'une erreur de validation Zod", () => {
    const parsed = z.object({ title: z.string().min(3) }).safeParse({ title: "a" });
    const { status, body } = run(new ZodValidationException(parsed.error));
    expect(status).toBe(HttpStatus.BAD_REQUEST);
    expect(body.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(body.fieldErrors?.title?.length).toBe(1);
  });

  it("transmet tel quel le contenu d'une AppException", () => {
    const { status, body } = run(
      new AppException(HttpStatus.CONFLICT, ErrorCode.CONFLICT, "Cet espace existe déjà."),
    );
    expect(status).toBe(HttpStatus.CONFLICT);
    expect(body).toEqual({
      statusCode: HttpStatus.CONFLICT,
      code: ErrorCode.CONFLICT,
      message: "Cet espace existe déjà.",
    });
  });

  it("remplace les messages anglais de Nest par un message français", () => {
    const { body } = run(new NotFoundException("Cannot GET /nope"));
    expect(body.code).toBe(ErrorCode.NOT_FOUND);
    expect(body.message).toBe("L'élément demandé est introuvable.");
  });

  it("traduit le rate limiting", () => {
    const { status, body } = run(new ThrottlerException());
    expect(status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
  });

  it("convertit une violation d'unicité Prisma en conflit", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7",
    });
    expect(run(error).status).toBe(HttpStatus.CONFLICT);
  });

  it("masque le détail d'une erreur inattendue", () => {
    const { status, body } = run(new Error("connexion refusée sur 10.0.0.12"));
    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.code).toBe(ErrorCode.INTERNAL);
    expect(body.message).not.toContain("10.0.0.12");
  });
});
