import "dotenv/config";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { APP_NAME } from "@regie/shared";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

/** Chemin de la documentation Swagger (développement uniquement). */
const SWAGGER_PATH = "docs";

/** L'API est derrière un seul proxy (le BFF Next.js) : on fait confiance à son X-Forwarded-For. */
const TRUSTED_PROXY_HOPS = 1;

/** Configure la documentation OpenAPI, générée à partir des DTO Zod. */
function setupSwagger(app: NestExpressApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(`API ${APP_NAME}`)
      .setDescription("API interne de Régie : évolutions, validations, recette.")
      .setVersion("0.0.0")
      .build(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, cleanupOpenApiDoc(document));
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = app.get(AppConfigService);

  app.set("trust proxy", TRUSTED_PROXY_HOPS);
  app.use(helmet());
  // Lecture des cookies httpOnly de session (access / refresh tokens)
  app.use(cookieParser());
  // Seul le front est autorisé ; en pratique il passe par le BFF (même machine, côté serveur)
  app.enableCors({ origin: config.get("WEB_ORIGIN"), credentials: true });
  // Ferme proprement Prisma et les connexions à l'arrêt (SIGTERM du déploiement)
  app.enableShutdownHooks();

  if (!config.isProduction) setupSwagger(app);

  const port = config.get("PORT");
  await app.listen(port);
  Logger.log(`API démarrée sur le port ${port}`, "Bootstrap");
}

void bootstrap();
