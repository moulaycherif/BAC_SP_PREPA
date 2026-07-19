import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export function initRankingSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("join:qcm", (qcmId: string) => {
      socket.join(qcmId);
      console.log(`User ${socket.id} joined QCM room ${qcmId}`);
    });

    socket.on("progress:update", async (data: {
      userId: string;
      qcmId: string;
      currentQuestion: number;
      totalQuestions: number;
    }) => {
      io.to(data.qcmId).emit("progress:updated", data);
    });
  });

  return io;
}
