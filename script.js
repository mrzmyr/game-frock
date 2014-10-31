var gameCanvas = document.getElementById('game');
var gameBackgroundCanvas = document.getElementById('game-background');

var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;
var TILE_ROWS = 20;
var TILE_COLUMNS = 20;

var CANVAS_HEIGHT = gameCanvas.clientHeight;
var CANVAS_WIDTH = gameCanvas.clientWidth;

var IMAGES = {
  GRAS: 'img/gras.png',
  MOTORBIKE: 'img/motorbike.png',
  CAR1: 'img/car1.png',
  CAR2: 'img/car2.png',
  CAR3: 'img/car3.png',
  TRUCK: 'img/truck.png',
  STONE: 'img/stone.png',
  STREET: 'img/street.png',
  FROCK: 'img/frock.png',
  FROCK_DEAD: 'img/frock_dead.png',
};

var game = {

  debug: false,
  pause: false,

  // get set to true when level get one up
  levelUp: false,

  // get set to true when game should starts over
  reset: false,

  level: {

    value: 1,
    node: document.getElementById('level'),

    updateView: function () {
      this.node.innerHTML = 'Level: <span>' + this.value + '</span>';
    },

    update: function () {

      if(game.levelUp) {
        this.value += 1;
      }

      if(game.reset) {
        game.reset = false;
        this.value = 1;
      }

      this.updateView();

      // reset
      obstacles = [];
      ways = [];
      blocks = [];

      // way spaces
      var waySpaces = 5;
      var waySpaceCoords = [];

      var possibleWayRows = [];
      var max = TILE_COLUMNS - 2;

      // push all possibilities
      while(max >= 2) {
        possibleWayRows.push(max);
        max -= 2;
      }

      // add spaces by random
      for(i = 0; i <= waySpaces; i++) {
        waySpaceCoords.push(
          possibleWayRows.splice(
            Math.floor(Math.random() * possibleWayRows.length - 1),
            1
          )[0]
        );
      }

      // sort by int
      waySpaceCoords = waySpaceCoords.sort(function (a, b) { return a - b; });

      var nextStart = 2;

      for(s = 0; s < waySpaceCoords.length; s++) {

        // adding the ways
        // ---------------------------------

        var wayRow1 = nextStart - 1;
        var wayRow2 = waySpaceCoords[s];

        nextStart = waySpaceCoords[s] + 2;

        if(s == waySpaceCoords.length - 1) {
          wayRow2 = 19; // end up with last line to bottom
        }

        ways.push(
          new Way(
            wayRow1 * TILE_HEIGHT,
            wayRow2 * TILE_HEIGHT
          )
        );

        // adding the blocks
        // ---------------------------------

        if(this.value > 1 && s != waySpaceCoords.length - 1) { // after first level & wothout last line

          var coords = [];
          var coordsPossible = [];
          var blocksCount = Math.floor((this.value >= 37 ? 36 : this.value));

          // hate doubles
          for(bc = 1; bc <= 19; bc++) {
            // push all possibilities
            coordsPossible.push(bc);
          }

          for(i = 0; i < blocksCount; i++) {
            // push only possibles
            coords.push(coordsPossible.splice(Math.floor(Math.random() * coordsPossible.length - 1), 1)[0]);
          }

          for(c = 0; c < coords.length; c++) {
            blocks.push(new block(coords[c] * 32, wayRow2 * 32));
          }
        }
      }

      // add obstacles to the ways
      // ---------------------------------

      for(var w in ways) {

        var y1 = ways[w].y1 / TILE_HEIGHT;
        var y2 = ways[w].y2 / TILE_HEIGHT;

        for(i = y1; i < y2; i++) {

          var x = Math.floor(genRnd(0, CANVAS_WIDTH));
          var y = i;
          var direction = (genRnd(1, 10) > 5 ? 'ltr' : 'rtl');
          var speed = 0.005 * Math.pow(this.value, 2) + 0.2;
          var count = Math.floor(genRnd(1, Math.ceil(this.value/2))); // every 10th level

          var oldDistance = 0;

          for(r = 0; r < count; r++) {
            var type = Math.round(genRnd(1,5));

            x += TILE_WIDTH * 2; // + 64, every obstacle

            // is out of view, set to right border
            if((TILE_WIDTH * TILE_COLUMNS) < x) {
              x -= TILE_WIDTH * TILE_COLUMNS + TILE_WIDTH;
            }

            obstacles.push(new Obstacle(x + oldDistance, y * TILE_HEIGHT, type, direction, speed));
          }
        }
      }

    },

    draw: function () {
      var img = new Image();

      img.onload = function () {

        var gameBackgroundCanvasContext = gameBackgroundCanvas.getContext('2d');

        // draw gras
        for (var heightIndex = gameBackgroundCanvas.height / 32; heightIndex >= 0; heightIndex--) {
          for (var widthIndex = gameBackgroundCanvas.width / 32; widthIndex >= 0; widthIndex--) {
            gameBackgroundCanvasContext.drawImage(img, widthIndex * 32, heightIndex * 32);
          }
        }

        // draw ways after gras was loaded and draw
        for(var w in ways) {
          ways[w].draw(gameBackgroundCanvasContext);
        }

      }.bind(this);

      img.src = IMAGES.GRAS;
    }
  }
};

function LifesService() {

  this.count = 3;
  this.nodes = document.getElementById('lifes').getElementsByTagName('img');

  this.updateView = function() {

    for(i = 0; i < 3; i++) {
      this.nodes[i].style.display = 'none';
    }

    for(i = 0; i < this.count; i++) {
      this.nodes[i].style.display = 'inline-block';
    }
  };

  this.getCount = function (count) {
    return this.count;
  },

  this.setCount = function (count) {
    this.count = count;
    this.updateView();
  };
}

/**
 * StatusScreen
 * @description StatusScreen show status messages
 */
function StatusScreen() {
  this.node = document.getElementById('status-screen');
}

StatusScreen.prototype.show = function(text, showTime) {
  this.node.classList.add('show');
  this.node.innerHTML = text;

  if(typeof showTime === 'number') {
    setTimeout(this.hide.bind(this), showTime);
  }

  return this;
};

StatusScreen.prototype.hide = function () {
  this.node.classList.remove('show');

  return this;
};

// some useful functions
// ------------------------------------------------------------------------------------------

// https://gist.github.com/eikes/3925183
function imgpreload( imgs, callback ) {
  "use strict";
  var loaded = 0;
  var images = [];
  imgs = Object.prototype.toString.apply( imgs ) === '[object Array]' ? imgs : [imgs];
  var inc = function() {
    loaded += 1;
    if ( loaded === imgs.length && callback ) {
      callback( images );
    }
  };
  for ( var i = 0; i < imgs.length; i++ ) {
    images[i] = new Image();
    images[i].onabort = inc;
    images[i].onerror = inc;
    images[i].onload = inc;
    images[i].src = imgs[i];
  }
}

// ty paul <3
window.requestAnimFrame = (function(){
  return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback, element){
    window.setTimeout(callback, 1000 / 60);
  };
})();

/**
 *  @name prt - preRenderingTemplate
 *  @desc generates a pre rendering canvas with width of w and height of h
 */
function prt(width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 *  @name printBorder
 *  @desc draws on context 2d ctx a border from 0, 0 to w, h
 */
function printBorder(ctx, w, h) {
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.lineTo(0, 0);
  ctx.strokeStyle = 'deeppink';
  ctx.stroke();
}

/**
 *  @name genRnd
 *  @desc generates an number between min and max
 */
function genRnd (min, max) {
  return Math.random() * (max - min) + min;
}

/**
 *  @name hits
 *  @desc returns a boolean depending on collision of both given coordinates
 */

function hits(x1, y1, w1, h1, x2, y2, w2, h2, border) {

  border = border || 0;

  var left1   = x1;
  var left2   = x2;
  var right1  = x1 + w1;
  var right2  = x2 + w2;

  var top1  = y1;
  var top2  = y2 + border;
  var bottom1 = y1 + h1;
  var bottom2 = y2 + h2 - border;

  if (bottom1 <= top2) return false;
  if (top1 >= bottom2) return false;

  if (right1 <= left2) return false;
  if (left1 >= right2) return false;

  return true;
}

/**
 *  @name scrollAnimateTo
 *  @desc returns a boolean depending on collision of both given coordinates
 *  @params
 *    offset - means the pixel to scroll down;
 *    durations - means the time of scrolling (animation)
 *  @thanks: http://goo.gl/OYz6l
 */
 var scrollAnimateTo = function(offset, duration) {
  this.step = (offset - window.scrollY ) / duration;
  this.start = new Date().getTime();
  this.startY = window.scrollY;
  this.intervalHandler = window.setInterval(function() {
    var current = new Date().getTime();
    if(current - this.start > duration) {
      clearInterval(this.intervalHandler);
      return;
    }
    window.scrollTo(0, this.startY  + (current - this.start) * this.step);
  }, 10);
};

/* objects settings
// -----------------------------------------------------------------------------------------*/

/**
 *  @name obstacle
 *  @desc generates an object of an obstacle
 */

function Obstacle (x, y, type, direction, speed) {

  this.x = x;
  this.y = y;

  this.width = TILE_WIDTH;
  this.height = TILE_HEIGHT;

  this.direction = direction || 'ltr';
  this.type = type || 1;
  this.speed = speed || 0.5;

  if(this.direction === 'rtl') {
    this.speed *= -1;
  }

  this.template = prt(this.width, this.height);
  this.templateCtx = this.template.getContext('2d');

  this.image = undefined;
};

Obstacle.prototype.drive = function (delta) {

  if(this.x < -this.width) {
    this.x = CANVAS_WIDTH;
  }

  if(this.x > CANVAS_WIDTH + this.width) {
    this.x = -this.width;
  }

  this.x += this.speed * delta;
};

Obstacle.prototype.draw = function (destContext) {

  if(this.image === undefined) {

    this.image = new Image();

    this.image.onload = function () {
      // turn around
      if(this.direction === 'ltr') {
        this.templateCtx.translate(0 , 0);
        this.templateCtx.rotate(180 * Math.PI / 180);
        this.templateCtx.drawImage(this.image, -this.width, -this.height, this.width, this.height);
        this.templateCtx.rotate(180 * Math.PI / 180);
        this.templateCtx.translate(0, 0);
      } else {
        this.templateCtx.drawImage(this.image, 0, 0, this.width, this.height);
      }
    }.bind(this);

    switch(this.type) {
      case 1: this.image.src = IMAGES.MOTORBIKE; break;
      case 2: this.image.src = IMAGES.CAR1; break;
      case 3: this.image.src = IMAGES.CAR2; break;
      case 4: this.image.src = IMAGES.CAR3; break;
      case 5: this.image.src = IMAGES.TRUCK; break;
    }

    if(game.debug) {
      printBorder(this.templateCtx, this.width, this.height);
    }
  }

  // put pre rendered canvas on game canvas
  destContext.drawImage(this.template, this.x, this.y);
};

/**
 *  @name frock
 *  @desc generates the frock object
 */

function Frock (x, y) {

  this.width = TILE_WIDTH;
  this.height = TILE_WIDTH;

  this.x = CANVAS_HEIGHT / 2;
  this.y = CANVAS_HEIGHT - this.height;

  this.dead = false;
  this.template = prt(this.width, this.height);
  this.templateCtx = this.template.getContext('2d');

  this.image = undefined;
}

Frock.prototype.draw = function (destinationContext) {

  if(this.image === undefined || this.reseted || this.dead) {

    this.reseted = false;

    this.image = new Image();

    this.image.onload = function () {
      this.templateCtx.clearRect(0, 0, this.width, this.height);
      this.templateCtx.drawImage(this.image, 0, 0);

      if(game.debug) {
        printBorder(this.templateCtx, this.width, this.height);
      }
    }.bind(this);

    if(!this.dead) {
      this.image.src = IMAGES.FROCK;
    } else {
      this.image.src = IMAGES.FROCK_DEAD;
    }
  }

  // put pre rendered canvas on canvas
  destinationContext.drawImage(this.template, this.x, this.y);
};

Frock.prototype.move = function (direction) {

  var step = this.height;

  var tempCoords = { x: this.x, y: this.y };
  var wouldHit = false;

  switch(direction) {
    case 'left' : tempCoords.x = this.x - step; break;
    case 'right': tempCoords.x = this.x + step; break;
    case 'up' : tempCoords.y = this.y - step; break;
    case 'down' : tempCoords.y = this.y + step; break;
  }

  // collision with blocks
  for(b = 0; b < blocks.length; b++) {
    wouldHit = hits(
      tempCoords.x,
      tempCoords.y,
      this.width,
      this.height,
      blocks[b].x,
      blocks[b].y,
      blocks[b].w,
      blocks[b].h
    ) || wouldHit;
  }

  // would hit a the border of the canvas
  wouldHit = wouldHit ||
        hits(tempCoords.x, tempCoords.y, this.width, this.height, 0, -this.height, CANVAS_WIDTH, this.height) || // top wall
        hits(tempCoords.x, tempCoords.y, this.width, this.height, -this.width, 0, this.width, CANVAS_HEIGHT) || // left wall
        hits(tempCoords.x, tempCoords.y, this.width, this.height, CANVAS_WIDTH, 0, this.width, CANVAS_HEIGHT) || // right wall
        hits(tempCoords.x, tempCoords.y, this.width, this.height, 0, CANVAS_HEIGHT, CANVAS_WIDTH, this.height); // bottom wall

  if(!wouldHit) {
    switch(direction) {
      case 'left': this.x -= step; break;
      case 'right': this.x += step; break;
      case 'up': this.y -= step; break;
      case 'down': this.y += step; break;
    }

    // when resetting don't play a move sound
    if(direction !== 'reset') {
      soundMaschine.play('move');
    }

    // play random car meep audio - chance 1 to 100
    if(Math.floor(genRnd(1, 100)) === 50) {
      soundMaschine.play('car');
    }
  }

  if(direction === 'reset') {
    // scrollAnimateTo(CANVAS_HEIGHT, 100);

    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT - this.height;

    this.reseted = true;
  }

};

/**
 *  @name way
 *  @desc generates an way object
 */

function Way (y1, y2) {

  this.y1 = y1;
  this.y2 = y2;
  this.height = this.y2 - this.y1;
  this.width = CANVAS_WIDTH;

  this.template = prt(this.width, this.height);
  this.templateCtx = this.template.getContext('2d');

  this.image = undefined;
};

Way.prototype.draw = function (destinationContext) {

  this.image = new Image();

  this.image.onload = function () {

    for (var h = this.height / TILE_HEIGHT; h >= 0; h--) {
      for (var w = this.width / TILE_WIDTH; w >= 0; w--) {
        this.templateCtx.drawImage(this.image, w * TILE_WIDTH, h * TILE_HEIGHT);
      }
    }

    if(game.debug) {
      printBorder(this.templateCtx, this.width, this.height);
    }

    destinationContext.drawImage(this.template, 0, this.y1);
  }.bind(this);

  this.image.src = IMAGES.STREET;

  // clean
  this.templateCtx.clearRect(0, 0, this.width, this.height);
};

/**
 *  @name block
 *  @desc generates a block object
 */

var block = function (x, y, w, h) {

  this.x = x;
  this.y = y;
  this.w = 32;
  this.h = 32;

  this.template = prt(this.w, this.h);
  this.templateCtx = this.template.getContext('2d');

  var img;

  this.draw = function (destinationContext) {

    if(img === undefined) {
      img = new Image();

      img.onload = function () {
        this.templateCtx.drawImage(img, 0, 0);
        if(game.debug) printBorder(this.templateCtx, this.w, this.h);
      }.bind(this);

      img.src = IMAGES.STONE;
    }

    // put pre rendered canvas on canvas
    destinationContext.drawImage(this.template, this.x, this.y);
  };
};

/**
 *  @name fpsMeter
 *  @desc fpsMeter module to update the view with the actual fps count
 */

function FpsMeter () {

  this._then = Date.now();
  this._fps = 0;
  this.node = document.getElementById('fps');

  this.isShowing = true;

  setInterval(function () {
    this.node.innerHTML = this._fps;
    this._fps = 0;
  }.bind(this), 1000);

}

FpsMeter.prototype.show = function () {
  if(!this.isShowing) {
    this.isShowing = true;
    this.node.style.display = 'block';
  }
};

FpsMeter.prototype.hide = function () {
  if(this.isShowing) {
    this.isShowing = false;
    this.node.style.display = 'none';
  }
};

FpsMeter.prototype.start = function () {
  this._now = Date.now();
  this.delta = this._now - this._then;

  this._fps++;
};

FpsMeter.prototype.end = function () {
  this._then = this._now;
};

/**
 *  @name audio
 *  @desc generates the audio object
 */

function SoundMaschine () {

  this._SOUNDS = ['move', 'dead', 'levelup', 'car'];

  this.path = 'audio/';
  this.nodes = {};

  for (var s = 0; s < this._SOUNDS.length; s++) {
    this.nodes[this._SOUNDS[s]] = document.createElement('audio');
    this.nodes[this._SOUNDS[s]].id = 'sound_' + this._SOUNDS[s];
    this.nodes[this._SOUNDS[s]].volume = 0.5;
    this.nodes[this._SOUNDS[s]].src = this.path + this._SOUNDS[s] +  '.wav';
    document.body.appendChild(this.nodes[this._SOUNDS[s]]);
  }
}

SoundMaschine.prototype.play = function (soundId) {
  if(this._SOUNDS.indexOf(soundId) !== -1) {
    this.nodes[soundId].currentTime = 0;
    this.nodes[soundId].play();
  }
};

// actions! yay!
// ------------------------------------------------------------------------------------------

var frock = new Frock();
var soundMaschine  = new SoundMaschine();
var fpsMeter = new FpsMeter();

var lifesService = new LifesService();

var statusScreen = new StatusScreen();

var obstacles = [];
var ways = [];
var blocks = [];

function update() {

  fpsMeter.start();

  if(game.debug) {
    fpsMeter.show();
  } else {
    fpsMeter.hide();
  }

  requestAnimFrame(update);

  if(!game.pause) {

    for(i = 0; i < obstacles.length; i++) {

      obstacles[i].drive(fpsMeter.delta);  // let the obstacle drive

      if(!frock.dead) {
        frock.dead = hits(
          frock.x,
          frock.y,
          frock.width,
          frock.height,
          obstacles[i].x,
          obstacles[i].y,
          obstacles[i].width,
          obstacles[i].height,
          1
        );

        if(frock.dead) {

          var lifesCount = lifesService.getCount();

          if(lifesCount > 0) {
            statusScreen.show('<strong>' + (lifesCount - 1) + ' Lifes left</strong> <br>Press \'space\' to restart the Level')
          } else if(lifesCount === 0) {
            statusScreen.show('<strong>Game Over</strong> <br> Press \'space\' to restart the Game')
          }

          soundMaschine.play('dead');
        }
      }

    }
  }

  // level up
  if(frock.y < frock.height && !frock.dead) {

    frock.move('reset');
    soundMaschine.play('levelup');

    statusScreen.show('Level ' + (game.level.value + 1), 500);

    game.levelUp = true;

    game.level.update();
    game.level.draw();

    // pause game for 200ms to prevent from
    // accidentally moving on street after level up
    game.pause = true;

    setTimeout(function () {
      game.pause = false;
    }, 200);
  }

  draw();

  fpsMeter.end();
}

function draw() {

  var gameCanvasContext = gameCanvas.getContext('2d');

  // clear canvas
  gameCanvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // draw frock
  frock.draw(gameCanvasContext);

  // draw blocks
  for(var b in blocks) {
    blocks[b].draw(gameCanvasContext);
  }

  // draw obstacles
  for(var o in obstacles) {
    obstacles[o].draw(gameCanvasContext);
  }
}

window.addEventListener('keydown', function (event) {

  event = event || window.event;
  var c = event.keyCode;
  var step = frock.height;

  // prevent scrolling, up, down, space
  if(c === 40 || c === 38 || c === 32) event.preventDefault();

  if(!game.pause && !frock.dead) {

    // if(frock.y - frock.h * 3 < window.scrollY) {
    //   scrollAnimateTo(frock.y - frock.h * 3, 100);
    // }

    switch(c) {
      case 40: case 83: frock.move('down'); break;
      case 87: case 38: frock.move('up'); break;
      case 68: case 39: frock.move('right'); break;
      case 65: case 37: frock.move('left'); break;
      case 13: game.debug = !game.debug; break;
    }
  }

  var lifesCount = lifesService.getCount();

  // new game
  if(c == 32 && frock.dead && lifesCount === 0) {

    frock.dead = false;
    frock.move('reset');

    statusScreen.hide();

    game.pause = false;
    game.reset = true;

    lifesService.setCount(3);

    game.level.update();
    game.level.draw();

  // new chance
  } else if(c == 32 && frock.dead && lifesCount > 0) {

    frock.dead = false;
    frock.move('reset');

    statusScreen.hide();

    game.newChance = true;
    game.pause = false;

    lifesService.setCount(lifesService.getCount() - 1);

    game.level.draw();

  // pause game, if space was pressed & frock is alive
  } else if(c == 32 && !frock.dead) {
    game.pause = !game.pause;

    if(game.pause) {
      statusScreen.show('Pause');
    } else {
      statusScreen.hide();
    }
  }
}, false);

function init () {

  var imgs = [];

  for (var i in IMAGES) {
    imgs.push(IMAGES[i]);
  }

  game.pause = true;

  statusScreen.show('Use arrow keys to move<br>Press \'space\' to start');

  imgpreload(imgs, function () {

    gameCanvas.height = gameBackgroundCanvas.height = CANVAS_WIDTH;
    gameCanvas.width = gameBackgroundCanvas.width = CANVAS_WIDTH;

    game.level.update();
    game.level.draw();

    update();

  });
}

window.addEventListener('DOMContentLoaded', init, false);
