import { Module } from "@nestjs/common";
import { ClientService } from "./client.service";
import { PrismaModule } from "prisma/prisma.module";
import { ClientController } from "./client.controller";
import { SendGridModule } from "src/sendgrid/sendgrid.module";

@Module({
    imports: [PrismaModule, SendGridModule],
    controllers: [ClientController],
    providers: [ClientService],
    exports: [ClientService]
})
export class ClientModule {}