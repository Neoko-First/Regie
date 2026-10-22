import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppConfigService } from "./config/app-config.service";

/** L'API est derrière un seul proxy (le BFF Next.js) : on fait confiance à son X-Forwarded-For. */
const TRUSTED_PROXY_HOPS = 1;

/**
 * Applique les middlewares transverses de l'application. Partagé entre `main.ts`
 * et les tests e2e, pour tester exactement la configuration de production.
 *
 * @param app - Application Nest (Express)
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.set("trust proxy", TRUSTED_PROXY_HOPS);
  app.use(helmet());
  // Lecture des cookies httpOnly de session (access / refresh tokens)
  app.use(cookieParser());
  // Seul le front est autorisé ; en pratique il passe par le BFF (même machine, côté serveur)
  app.enableCors({ origin: config.get("WEB_ORIGIN"), credentials: true });
}
