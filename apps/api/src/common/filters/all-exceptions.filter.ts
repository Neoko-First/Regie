import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { type ApiErrorBody, ErrorCode, z } from "@regie/shared";
import type { Response } from "express";
import { ZodValidationException } from "nestjs-zod";
import { Prisma } from "../../generated/prisma/client";
import { AppException } from "../errors/app.exception";
import { getDefaultError, INTERNAL_ERROR } from "../errors/error-messages";

/** Codes d'erreur Prisma traduits en erreurs HTTP compréhensibles. */
const PRISMA_ERROR_STATUS: Record<string, HttpStatus> = {
  P2002: HttpStatus.CONFLICT, // contrainte d'unicité violée
  P2025: HttpStatus.NOT_FOUND, // enregistrement introuvable
};

/** Message affiché quand la validation Zod échoue. */
const VALIDATION_MESSAGE = "Certains champs sont invalides.";

/**
 * Reconnaît une erreur Zod par sa forme plutôt que par `instanceof` : nestjs-zod et
 * @regie/shared peuvent résoudre deux copies distinctes du paquet zod.
 */
function isZodError(error: unknown): error is z.ZodError {
  return (
    typeof error === "object" && error !== null && "issues" in error && Array.isArray(error.issues)
  );
}

/**
 * Filtre global : convertit TOUTE exception au format uniforme de l'API
 * `{ statusCode, message, code, fieldErrors? }` (CLAUDE.md §13), avec des messages en français.
 * Les erreurs inattendues sont journalisées côté serveur, sans détail renvoyé au client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);
    response.status(body.statusCode).json(body);
  }

  /** Construit la réponse d'erreur normalisée. */
  private toErrorBody(exception: unknown): ApiErrorBody {
    if (exception instanceof ZodValidationException) {
      return this.fromZodError(exception.getZodError());
    }
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        ...(exception.fieldErrors ? { fieldErrors: exception.fieldErrors } : {}),
      };
    }
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status = PRISMA_ERROR_STATUS[exception.code];
      if (status) return { statusCode: status, ...getDefaultError(status) };
    }

    // Erreur imprévue : trace complète côté serveur uniquement
    this.logger.error(
      exception instanceof Error ? exception.stack : "Exception non standard",
      AllExceptionsFilter.name,
    );
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, ...INTERNAL_ERROR };
  }

  /** Erreur de validation Zod → 400 avec le détail par champ, pour `form.setError()` côté front. */
  private fromZodError(error: unknown): ApiErrorBody {
    const fieldErrors = isZodError(error)
      ? (z.flattenError(error).fieldErrors as Record<string, string[]>)
      : {};
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_FAILED,
      message: VALIDATION_MESSAGE,
      fieldErrors,
    };
  }

  /**
   * Exception HTTP de Nest (NotFoundException, ThrottlerException…) : on garde le statut
   * mais on remplace le message anglais par défaut de Nest par un message français.
   */
  private fromHttpException(exception: HttpException): ApiErrorBody {
    const statusCode = exception.getStatus();
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception.stack, AllExceptionsFilter.name);
    }
    return { statusCode, ...getDefaultError(statusCode) };
  }
}
