import { Module } from "@nestjs/common";
import { ClientService } from "./client.service";
import { PrismaModule } from "prisma/prisma.module";
import { ClientController } from "./client.controller";
import { BrevoModule } from "src/brevo/brevo.module";

@Module({
    imports: [PrismaModule, BrevoModule],
    controllers: [ClientController],
    providers: [ClientService],
    exports: [ClientService]
})
export class ClientModule {}