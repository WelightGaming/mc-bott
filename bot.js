const mineflayer = require('mineflayer');
const { Movements, pathfinder, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;

const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot Is Ready');
});

app.listen(3000, () => {
  console.log('Server started');
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account']['username'],
    password: config['bot-account']['password'],
    auth: config['bot-account']['type'],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  bot.loadPlugin(pathfinder);
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.settings.colorsEnabled = false;

  bot.once('spawn', () => {
    console.log('\x1b[33m[BotLog] Bot joined the server\x1b[0m');

    // Circular movement parameters
    const radius = 5; // Radius of the circular chain
    const numPoints = 8; // Number of points in the chain
    const center = bot.entity.position;

    const angleIncrement = (2 * Math.PI) / numPoints;
    let angle = 0;

    // Function to calculate the next target position in the circular chain
    function getNextTargetPosition() {
      const x = center.x + radius * Math.cos(angle);
      const z = center.z + radius * Math.sin(angle);
      const y = center.y; // Keep the same y-coordinate
      angle += angleIncrement;
      return { x, y, z };
    }

    // Start the circular movement
    let target = getNextTargetPosition();
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, 1));

    // Event when the bot reaches the current target
    bot.on('goal_reached', () => {
      target = getNextTargetPosition();
      bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, 1));
    });
  });

  bot.on('chat', (username, message) => {
    if (config.utils['chat-log']) {
      console.log(`[ChatLog] <${username}> ${message}`);
    }
  });

  bot.on('death', () => {
    console.log('\x1b[33m[BotLog] Bot has died and respawned', bot.entity.position, '\x1b[0m');
  });

  bot.on('kicked', (reason) => {
    console.log('\x1b[33m[BotLog] Bot was kicked from the server. Reason:', reason, '\x1b[0m');
  });

  bot.on('error', (err) => {
    console.log('\x1b[31m[ERROR]', err.message, '\x1b[0m');
  });
}

createBot();
