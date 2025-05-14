import { Module } from "@nestjs/common";
import { ClientService } from "./client.service";
import { PrismaModule } from "prisma/prisma.module";
import { ClientController } from "./client.controller";

@Module({
    imports: [PrismaModule],
    controllers: [ClientController],
    providers: [ClientService],
    exports: [ClientService]
})
export class ClientModule {}