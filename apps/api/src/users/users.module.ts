import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";

/** Annuaire des utilisateurs. */
@Module({ controllers: [UsersController] })
export class UsersModule {}
