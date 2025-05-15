import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:5173', 'https://www.drogueriane.site', 'https://drogueriane.site'],
        methods: ['GET', 'POST'],
    }
})

export class ScanGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('join-room')
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() sessionId: string
    ){
        client.join(sessionId);
    }

    @SubscribeMessage('scan')
    handleScan(
        @MessageBody() payload: { sessionId: string, productBarcode: string },
    ){
        this.server.to(payload.sessionId).emit('scan', payload.productBarcode);
    }

}
