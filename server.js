const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = new Map(); // Using a Map to store users with their alias and avatar

// Serve static files
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('requestAlias');

    socket.on('submitAlias', (alias) => {
        if (!alias || users.has(alias)) {
            socket.emit('aliasError', 'Alias already taken or invalid');
        } else {
            const avatarUrl = `https://robohash.org/${encodeURIComponent(alias)}?set=set3`; // Unique avatar for each alias
            users.set(alias, { avatar: avatarUrl, socketId: socket.id });
            socket.alias = alias;

            io.emit('userJoined', `${alias} has joined the chat`);
            io.emit('updateUserList', Array.from(users.keys())); // Send the updated alias list to clients
        }
    });

    socket.on('chatMessage', (message) => {
        if (socket.alias) {
            io.emit('chatMessage', { alias: socket.alias, message }); // Emit to all clients
        }
    });

    socket.on('mediaMessage', (data) => {
        if (socket.alias) {
            io.emit('mediaMessage', { alias: socket.alias, media: data.media, mediaType: data.mediaType });
        }
    });

    socket.on('disconnect', () => {
        if (socket.alias && users.has(socket.alias)) {
            users.delete(socket.alias);
            io.emit('userLeft', `${socket.alias} has left the chat`);
            io.emit('updateUserList', Array.from(users.keys())); // Send updated list on disconnect
        }
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
