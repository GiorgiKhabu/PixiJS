import { initDevtools } from "@pixi/devtools";
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";

// #region Global Variables
var gameOverMessage = null;
var landingMessage = null;
// #endregion

// #region Colors
const white = 0xffffff;
const black = 0x000000;
const red = 0xff4d4d;
const brown = 0x8b4513;
const cyan = 0x87ceeb;
const yellow = 0xffff00;
const orange = 0xff6a00;
const green = 0x009500;
// #endregion

// #region Helper Functions

var createButton = (text, width, height, color, onClick) => {
  const button = new Container();
  button.eventMode = "static";
  button.cursor = "pointer";
  button.interactive = true;
  button.buttonMode = true;

  const bg = new Graphics().roundRect(0, 0, width, height, 10).fill(color);
  button.addChild(bg);

  const btnText = new Text({
    text,
    style: {
      fontSize: 30,
      fill: white,
      align: "center",
    },
  });
  btnText.anchor.set(0.5, 0.5);
  btnText.x = width / 2;
  btnText.y = height / 2;

  button.addChild(btnText);

  button.on("pointerover", () => {});
  button.on("pointerout", () => {});

  button.on("pointerdown", () => {
    onClick();
  });

  return button;
};

const createMessage = (text) => {
  const message = new Text({
    text: `${text}\nAltitude: ${Math.floor(altitude)}`,
    style: {
      fontSize: 40,
      fill: yellow,
      stroke: {
        color: black,
        width: 2,
      },
      align: "center",
    },
  });

  message.x = app.screen.width / 2 - message.width / 2;
  message.y = app.screen.height / 2 - message.height / 2;

  return message;
};

// #endregion

const app = new Application();
await app.init({
  resizeTo: window,
});

initDevtools({ app });

app.canvas.style.position = "absolute";

document.body.appendChild(app.canvas);

const backgroundLayer = new Container();
const gameLayer = new Container();
const uiLayer = new Container();

app.stage.addChild(backgroundLayer);
app.stage.addChild(gameLayer);
app.stage.addChild(uiLayer);

// #region Sky
const sky = new Graphics()
  .rect(0, 0, app.screen.width, app.screen.height)
  .fill(cyan);

backgroundLayer.addChild(sky);
// #endregion

// #region Clouds
const createCloud = (x, y, scale = 1) => {
  const cloud = new Graphics();

  cloud.ellipse(0, 0, 60, 40).fill({ color: white, alpha: 0.9 });
  cloud.ellipse(-40, 0, 50, 30).fill({ color: white, alpha: 0.9 });
  cloud.ellipse(40, 0, 50, 40).fill({ color: white, alpha: 0.9 });

  cloud.x = x;
  cloud.y = y;
  cloud.scale = scale;

  return cloud;
};

const clouds = [];

for (let h = 0; h <= app.screen.height / 100; h++) {
  clouds.push(
    createCloud(
      Math.random() * app.screen.width,
      h * 100,
      Math.random() / 2 + app.screen.width / 1000
    )
  );
}

for (const c of clouds) {
  backgroundLayer.addChild(c);
}
// #endregion

// #region Balloon

const balloon = new Container();

const balloonBody = new Graphics().circle(0, 0, 40).fill(orange);
const basket = new Graphics().rect(-15, 50, 30, 20).fill(brown);
const leftStroke = new Graphics()
  .moveTo(-15, 50)
  .lineTo(-17, 35)
  .stroke({ width: 2, color: brown });

const rightStroke = new Graphics()
  .moveTo(15, 50)
  .lineTo(17, 35)
  .stroke({ width: 2, color: brown });

balloon.addChild(balloonBody);
balloon.addChild(basket);
balloon.addChild(leftStroke);
balloon.addChild(rightStroke);
gameLayer.addChild(balloon);

balloon.x = app.screen.width / 2;
balloon.y = app.screen.height - 150;

// motion
let ascentSpeed = 1.5;
let wiggleTime = 0;
let isAlive = true;

// #endregion

// #region Score Text

const scoreStyle = new TextStyle({
  fontFamily: "Arial",
  fontSize: 30,
  fill: white,
  stroke: {
    color: black,
    width: 2,
  },
});

const scoreText = new Text({ text: "Altitude: 0", style: scoreStyle });
scoreText.x = 20;
scoreText.y = 20;

uiLayer.addChild(scoreText);

// #endregion

// #region Particles

const particleContainer = new Container();
uiLayer.addChild(particleContainer);

class Particle {
  constructor(x, y, color, size = 5) {
    const g = new Graphics().circle(0, 0, size).fill(color);

    this.sprite = Sprite.from(app.renderer.generateTexture(g));
    this.sprite.x = x;
    this.sprite.y = y;

    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.life = 60;
    this.sprite.alpha = 1;

    particleContainer.addChild(this.sprite);
  }

  update() {
    this.sprite.x += this.vx;
    this.sprite.y += this.vy;
    this.life -= 1;
    this.sprite.alpha = this.life / 60;
    if (this.life <= 0) {
      particleContainer.removeChild(this.sprite);
      return false;
    }
    return true;
  }
}
let particles = [];

const triggerPopParticles = () => {
  for (let i = 0; i < 30; i++) {
    particles.push(new Particle(balloon.x, balloon.y, red, 4));
  }
};

const triggerLandingParticles = () => {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(balloon.x, balloon.y, yellow, 5));
  }
};

app.ticker.add((payload) => {
  particles = particles.filter((p) => p.update());
});

// #endregion

// #region Land Button

const showLandingMessage = () => {
  landingMessage = createMessage("You landed safly");
  uiLayer.addChild(landingMessage);
  triggerLandingParticles();
};

const onLandClick = () => {
  if (!isAlive || !gameStarted) return;

  isAlive = false;
  uiLayer.removeChild(landButton);
  uiLayer.addChild(restartBtn);
  showLandingMessage();
};

const landButton = createButton("Land Now", 200, 60, black, onLandClick);
landButton.x = app.screen.width - 220;
landButton.y = 20;

// #endregion

// #region Pop
const MIN_SAFE_ALTITUDE = 50;
const MAX_ALTITUDE = 500;
let popTriggered = false;
const POP_CHANCE = 0.001;

const burst = new Graphics().star(20, -20, 10, 30, 10).fill(yellow);

const triggerBalloonPop = () => {
  popTriggered = true;
  isAlive = false;

  balloon.addChild(burst);
  showGameOverMessage();
  uiLayer.addChild(restartBtn);
};

const showGameOverMessage = () => {
  gameOverMessage = createMessage("Game Over");
  uiLayer.addChild(gameOverMessage);
  triggerPopParticles();
};
// #endregion

// #region Ground

const ground = new Graphics()
  .rect(0, app.screen.height - 80, app.screen.width, 80)
  .fill(green);

uiLayer.addChild(ground);

// #endregion

// #region Game

var altitude = 0;
var gameStarted = false;
const CLOUD_SCROLL_SPEED = 1;
const WIGGLE_SPEED = 0.03;
const WIGGLE_DISTANCE = 5;
const balloonBaseX = app.screen.width / 2;
let balloonBaseY = app.screen.height - 150;

balloon.x = balloonBaseX;
balloon.y = balloonBaseY;

// #region Ticker

app.ticker.add((payload) => {
  if (!isAlive) return;
  if (!gameStarted) return;

  const delta = payload.deltaTime;
  if (balloon.y > 200) {
    balloon.y -= ascentSpeed * delta;
  }
  // score
  altitude += (ascentSpeed * delta) / 10;
  scoreText.text = `Altitude ${Math.floor(altitude)}`;

  wiggleTime += WIGGLE_SPEED * delta;
  if (wiggleTime > 80) {
    balloon.x = balloonBaseX + Math.sin(wiggleTime * 2) * WIGGLE_DISTANCE;
  } else {
    balloon.x = balloonBaseX + Math.sin(wiggleTime) * WIGGLE_DISTANCE;
  }

  for (const cloud of clouds) {
    const valueY =
      altitude < 500
        ? CLOUD_SCROLL_SPEED * delta
        : CLOUD_SCROLL_SPEED * delta * 2;
    cloud.y += valueY;

    if (cloud.y > app.screen.height + 50) {
      cloud.y = -50;
      cloud.x = Math.random() * app.screen.width;
    }
  }

  // change color
  const maxSafe = 200;
  const dangerRatio = Math.min(
    Math.max((altitude - maxSafe) / (MAX_ALTITUDE - maxSafe), 0),
    1
  );
  const redValue = 255;
  const greenValue = Math.floor(255 * (1 - dangerRatio));
  const blueValue = Math.floor(77 * (1 - dangerRatio));

  balloonBody.tint = (redValue << 16) + (greenValue << 8) + blueValue;

  // trigger pop effect
  if (!popTriggered && altitude > MIN_SAFE_ALTITUDE) {
    const popProbability = POP_CHANCE * delta;

    if (Math.random() < popProbability) {
      triggerBalloonPop();
    }
  }
});
// #endregion

// #region State
var startGame = () => {
  gameStarted = true;
  isAlive = true;
  popTriggered = false;

  uiLayer.removeChild(startGameBtn);
  uiLayer.removeChild(restartBtn);
  balloon.removeChild(burst);
  uiLayer.addChild(landButton);

  balloon.x = app.screen.width / 2;
  balloon.y = app.screen.height - 150;
  altitude = 0;
  wiggleTime = 0;
};

const restartGame = () => {
  uiLayer.removeChild(restartBtn);
  uiLayer.addChild(landButton);
  if (gameOverMessage) uiLayer.removeChild(gameOverMessage);
  if (landingMessage) uiLayer.removeChild(landingMessage);
  gameOverMessage = null;
  landingMessage = null;

  startGame();
};

// start
const startGameBtn = createButton("Start Game", 200, 60, red, startGame);
startGameBtn.x = app.screen.width / 2 - 100;
startGameBtn.y = app.screen.height / 2 - 30;
uiLayer.addChild(startGameBtn);

// restart
const restartBtn = createButton("Restart Game", 250, 60, orange, restartGame);
restartBtn.x = app.screen.width - 270;
restartBtn.y = 20;
// #endregion

// #endregion