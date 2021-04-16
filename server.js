const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var cards = [
  'red_0',
  'red_1',
  'red_2',
  'red_3',
  'red_4',
  'red_5',
  'red_6',
  'red_7',
  'red_8',
  'red_9',
  'red_skip',
  'red_reverse',
  'red_draw2',
  'green_0',
  'green_1',
  'green_2',
  'green_3',
  'green_4',
  'green_5',
  'green_6',
  'green_7',
  'green_8',
  'green_9',
  'green_skip',
  'green_reverse',
  'green_draw2',
  'blue_0',
  'blue_1',
  'blue_2',
  'blue_3',
  'blue_4',
  'blue_5',
  'blue_6',
  'blue_7',
  'blue_8',
  'blue_9',
  'blue_skip',
  'blue_reverse',
  'blue_draw2',
  'yellow_0',
  'yellow_1',
  'yellow_2',
  'yellow_3',
  'yellow_4',
  'yellow_5',
  'yellow_6',
  'yellow_7',
  'yellow_8',
  'yellow_9',
  'yellow_skip',
  'yellow_reverse',
  'yellow_draw2',
  'wild_1',
  'wild_2',
  'wild_3',
  'wild_4',
  'wild_draw4_1',
  'wild_draw4_2',
  'wild_draw4_3',
  'wild_draw4_4'
];

let groups = {};

function findPlayerBySocketId(group, socket) {
  let players = group.players;
  let ownPlayer = players.filter( (player) => {
    return player.id == socket.id;
  });
  return ownPlayer[0];
}

io.on('connection', socket => {

  socket.on('join group', ({ group, username }) => {
    if (!groups[group]) {
      // set up the deck and pile for the first time
      let deck = [];
      let pile = [];
      (function initialize() {
        let orderedDeck = cards.slice();
        let shuffledDeck = [];
        while (orderedDeck.length > 0) {
          let randomIndex = Math.floor(Math.random()*(orderedDeck.length));
          shuffledDeck.push(orderedDeck.splice(randomIndex, 1)[0]);
        }
        deck = shuffledDeck;
        pile.push(deck.pop());
      })();

      groups[group] = {
        groupName: group,
        players: [
          {
            id: socket.id,
            username: username,
            hand: []
          }
        ],
        deck: deck,
        pile: pile
      };
    } else {
      groups[group].players.push({
        id: socket.id,
        username: username,
        hand: []
      });
    }

    socket.join(group);
    io.in(group).emit('new state', groups[group]);
  });

  socket.on('draw card', ({ groupName }) => {
    const group = groups[groupName];
    const player = findPlayerBySocketId(group, socket);
    player.hand.push(group.deck.pop());

    // deck is running out...
    if (group.deck.length < 2) {
      let topOfPile = group.pile.pop();

      let combinedDeckAndPile = group.deck.concat(group.pile);
      if (group.pile.length < 10) {
        let extraDeck = cards.slice();
        combinedDeckAndPile = combinedDeckAndPile.concat(extraDeck);
      }

      let shuffledDeck = [];
      while (combinedDeckAndPile.length > 0) {
        let randomIndex = Math.floor(Math.random()*(combinedDeckAndPile.length));
        shuffledDeck.push(combinedDeckAndPile.splice(randomIndex, 1)[0]);
      }

      group.deck = shuffledDeck;
      group.pile= [topOfPile];
    }

    io.in(groupName).emit('new state', group);
  });

  socket.on('undo card', ({ groupName }) => {
    const group = groups[groupName];
    const player = findPlayerBySocketId(group, socket);

    if (group.pile.length > 1) {
      player.hand.push(group.pile.pop());
      io.in(groupName).emit('new state', group);
    } else {
      // only 1 item in pile, not taking anything
      // no new state to emit
    }
  });

  socket.on('play card', ({ groupName, cardIndex }) => {
    const group = groups[groupName];
    const player = findPlayerBySocketId(group, socket);

    group.pile.push(player.hand.splice(cardIndex, 1)[0]);

    io.in(groupName).emit('new state', group);
  });

  socket.on('disconnect', () => {

    let allGroups = Object.keys(groups);
    allGroups.forEach( group => {
      groups[group].players.forEach( (player) => {
        if (player.id == socket.id) {
          // add their cards back into the deck
          groups[group].deck = groups[group].deck.concat(player.hand);

          // shuffle deck
          let orderedDeck = groups[group].deck.slice();
          let shuffledDeck = [];
          while (orderedDeck.length > 0) {
            let randomIndex = Math.floor(Math.random()*(orderedDeck.length));
            shuffledDeck.push(orderedDeck.splice(randomIndex, 1)[0]);
          }
          groups[group].deck = shuffledDeck;

          // remove the user from the group
          groups[group].players = groups[group].players.filter( player => {
            return player.id != socket.id;
          });

          let numberPlayersLeft = groups[group].players.length;
          if (numberPlayersLeft > 0) {
            // update the group's users on the new state
            io.in(group).emit('new state', groups[group]);
          } else {
            // remove the empty group to clear space and let the name be reused
            delete groups[group];
          }
        }
      });
    });
  });
});

server.listen(80, () => {
  console.log('server running on port 80');
});
