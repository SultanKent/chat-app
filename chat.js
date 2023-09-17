const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/chatApp', { useNewUrlParser: true });

const messageSchema = new mongoose.Schema({
  mess: String,
  name: String,
  className: String,
  // Добавляем поле для хранения логина
  login: String,
});

const Message = mongoose.model('Message', messageSchema);

server.listen(3000);

app.get('/', function (request, response) {
  response.sendFile(__dirname + '/index.html');
});

connections = [];

io.sockets.on('connection', function (socket) {
  console.log("Успешное соединение");
  connections.push(socket);

  // Извлекаем все сохраненные сообщения из базы данных
  Message.find({})
    .then(messages => {
      // Отправляем сообщения клиенту
      messages.forEach(function (message) {
        socket.emit('add mess', { mess: message.mess, name: message.name, className: message.className });
      });
    })
    .catch(err => {
      console.error('Ошибка при извлечении сообщений:', err);
    });

  socket.on('disconnect', function (data) {
    connections.splice(connections.indexOf(socket), 1);
    console.log("Отключились");
  });

  socket.on('send mess', function (data) {
    const newMessage = new Message({
      mess: data.mess,
      name: data.name,
      className: data.className,
      login: data.login, // Сохраняем логин в базу данных
    });

    newMessage.save() // Используем промис для сохранения
      .then(() => {
        io.sockets.emit('add mess', { mess: data.mess, name: data.name, className: data.className });
      })
      .catch(err => {
        console.error('Ошибка при сохранении сообщения:', err);
      });
  });

  // Обработка регистрации
  socket.on('register', function (data) {
    // Здесь вы можете добавить логику для проверки уникальности логина, если это необходимо
    socket.emit('registration-success', data); // Отправляем клиенту подтверждение регистрации
  });
});