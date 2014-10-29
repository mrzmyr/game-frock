var gameNode = document.getElementById('game');
var gameBackgroundNode = document.getElementById('game-background');

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

var sys = {
  version: '0.1',
  dimension: {
    x: 32,
    y: 32,
    rows: 20,
    columns: 20
  }
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
      var waySpacesPerLevel = 8,
        waySpacesDif = Math.ceil(this.value / waySpacesPerLevel),
        waySpacesMax = 50 / waySpacesPerLevel,
        waySpaces = (waySpacesMax - waySpacesDif >= 0 ? (waySpacesMax - waySpacesDif) : 0),
        waySpaceCoords = [];

      var rands = [];
      var borders = 2;
      var nextStart = 2;
      var max = (canvas.height / frockObj.h) - borders; // complete height - top

      // push all possibilities
      while(max >= borders) {
        rands.push(max);
        max -= 2;
      }

      // add spaces by random
      for(i = 0; i < waySpaces; i++) {
        waySpaceCoords.push(rands.splice(Math.floor(Math.random() * rands.length - 1), 1)[0]);
      }

      // sort by int
      waySpaceCoords = waySpaceCoords.sort(function (a, b) { return a - b; });

      for(s = 0; s < waySpaceCoords.length; s++) {

        // adding the ways
        // ---------------------------------

        var waySpaceCoordsY1 = nextStart - 1;
        var waySpaceCoordsY2 = waySpaceCoords[s];
        nextStart = waySpaceCoords[s] + 2;

        if(s == waySpaceCoords.length-1) waySpaceCoordsY2 = 19; // end up with last line to bottom

        ways.push(new way(waySpaceCoordsY1 * 32, waySpaceCoordsY2 * 32, true)); // x, y, l, h, w

        // adding the blocks
        // ---------------------------------

        if(this.value > 1 && s != waySpaceCoords.length-1) { // after first level & wothout last line

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
            blocks.push(new block(coords[c] * 32, waySpaceCoordsY2 * 32));
          }
        }
      }

      // add obstacles to the ways
      // ---------------------------------

      for(var w in ways) {

        var y1 = ways[w].y1/32;
        var y2 = ways[w].y2/32;

        for(i = y1; i < y2; i++) {

          var x = Math.floor(genRnd(0, canvas.width));
          var y = i;
          var direction = (genRnd(1, 10) > 5 ? 'ltr' : 'rtl');
          var speed = 0.005 * Math.pow(this.value, 2) + 0.2;
          var count = Math.floor(genRnd(1, Math.ceil(this.value/2))); // every 10th level

          var oldDistance = 0;

          for(r = 0; r < count; r++) {
            var type = Math.round(genRnd(1,5));

            x += sys.dimension.x * 2; // + 64, every obstacle

            // is out of view, set to right border
            if((sys.dimension.x * sys.dimension.columns) < x) {
              x -= sys.dimension.x * sys.dimension.columns + 32;
            }

            obstacles.push(new obstacle(x + oldDistance, y * sys.dimension.y, type, direction, speed));
          }
        }
      }

    },

    draw: function () {
      var img = new Image();

      img.onload = function () {

        // draw gras
        for (var heightIndex = canvas.perLevel.node.height / 32; heightIndex >= 0; heightIndex--) {
          for (var widthIndex = canvas.perLevel.node.width / 32; widthIndex >= 0; widthIndex--) {
            canvas.perLevel.ctx.drawImage(img, widthIndex * 32, heightIndex * 32);
          }
        }

        // draw ways after gras was loaded and draw
        for(var w in ways) {
          ways[w].draw(canvas.perLevel.ctx);
        }

      }.bind(this);

      img.src = IMAGES.GRAS;
    }
  },

  lifes: {
    value: 3,
    nodes: document.getElementById('lifes').getElementsByTagName('img'),

    updateView: function() {

      for(i = 0; i < 3; i++) {
        this.nodes[i].style.display = 'none';
      }

      for(i = 0; i < this.value; i++) {
        this.nodes[i].style.display = 'inline-block';
      }
    },

    update: function () {

      if(game.newChance) {
        game.newChance = false;
        this.value -= 1;
      }

      if (game.reset) {
        this.value = 3;
      }

      this.updateView();
    }
  }
};

function StatusScreen() {
  this.node = document.getElementById('status-screen');
};

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

var canvas = {

  height: gameNode.clientHeight,
  width: gameNode.clientWidth,

  perLevel: {
    node: gameBackgroundNode,
    ctx: gameBackgroundNode.getContext('2d'),

    clear: function () {
      canvas.perLevel.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  },

  perFrame: {
    node: gameNode,
    ctx: gameNode.getContext('2d'),

    clear: function () {
        canvas.perFrame.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
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
  window.mozRequestAnimationFrame    ||
  window.oRequestAnimationFrame      ||
  window.msRequestAnimationFrame     ||
  function(/* function */ callback, /* DOMElement */ element){
    window.setTimeout(callback, 1000 / 60);
  };
})();

/**
 *  @name prt - preRenderingTemplate
 *  @desc generates a pre rendering canvas with width of w and height of h
 */
function prt(w, h) {
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
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

var obstacle = function (x, y, t, d, s, w, h) {

  this.x = x;
  this.y = y;

  this.w = w || 32;
  this.h = h || 32;
  this.d = d || 'ltr';
  this.s = s || 0.5; // speed
  this.t = t || 1; // type of obstacle

  this.tpl = prt(this.w, this.h); // for pre rendering
  this.ctx = this.tpl.getContext('2d');

  var img;

  this.drive = function (delta) {

    if(this.x < -this.w) this.x = canvas.width;
    if(this.x > canvas.width + this.w) this.x = -this.w;

    // drive the obstacles

    if(this.d === 'ltr') {
      this.x += this.s * delta; // left to right
    } else {
      this.x -= this.s * delta; // right to left
    }

  };

  this.draw = function (destContext /* destination context */) {

    if(img === undefined) {

      img = new Image();

      img.onload = function () {

        if(this.d === 'ltr') { // turn around
          this.ctx.translate(0 , 0);
          this.ctx.rotate(180 * Math.PI/180);
          this.ctx.drawImage(img, -this.w, -this.h, this.w, this.h);
          this.ctx.rotate(180 * Math.PI/180);
          this.ctx.translate(0, 0);
        } else {
          this.ctx.drawImage(img, 0, 0);
        }

        if(game.debug) printBorder(this.ctx, this.w, this.h);
      }.bind(this);

      switch(this.t) {
        case 1: img.src = IMAGES.MOTORBIKE; break;
        case 2: img.src = IMAGES.CAR1; break;
        case 3: img.src = IMAGES.CAR2; break;
        case 4: img.src = IMAGES.CAR3; break;
        case 5: img.src = IMAGES.TRUCK; break;
      }

    }

    // put pre rendered canvas on canvas
    destContext.drawImage(this.tpl, this.x, this.y);
  };
};

/**
 *  @name frock
 *  @desc generates the frock object
 */

var frock = function (x, y, w, h) {

  this.w = 32;
  this.h = 32;
  this.x = canvas.width / 2 || x;
  this.y = canvas.height - 32 || y; // middle

  this.died = false;
  this.template = prt(this.w, this.h);
  this.templateCtx = this.template.getContext('2d');

  var img;
  var lastDied;

  this.draw = function (destinationContext) {

    if(img === undefined || this.reseted || this.died) {

      this.reseted = false;

      img = new Image();

      img.onload = function () {
        this.templateCtx.clearRect(0, 0, this.w, this.h);
        this.templateCtx.drawImage(img, 0, 0);
      }.bind(this);

      if(!this.died) {
        img.src = IMAGES.FROCK;
      } else {
        img.src = IMAGES.FROCK_DEAD;
      }
    }

    // put pre rendered canvas on canvas
    destinationContext.drawImage(this.template, this.x, this.y);
  };

  this.move = function (direction) {

    var step = this.h;

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
        this.w,
        this.h,
        blocks[b].x,
        blocks[b].y,
        blocks[b].w,
        blocks[b].h
      ) || wouldHit;
    }

    // disable on game borders
    wouldHit = wouldHit ||
          hits(tempCoords.x, tempCoords.y, this.w, this.h, 0, -this.h, canvas.width, this.h) || // top wall
          hits(tempCoords.x, tempCoords.y, this.w, this.h, -this.w, 0, this.w, canvas.height) || // left wall
          hits(tempCoords.x, tempCoords.y, this.w, this.h, canvas.width, 0, this.w, canvas.height) || // right wall
          hits(tempCoords.x, tempCoords.y, this.w, this.h, 0, canvas.height, canvas.width, this.h); // bottom wall

    if(!wouldHit) {
      switch(direction) {
        case 'left' : this.x -= step; break;
        case 'right': this.x += step; break;
        case 'up' : this.y -= step; break;
        case 'down' : this.y += step; break;
      }

      if(direction !== 'reset') {
        audioObj.play('move');
      }

      // play random car meep audio - chance 1 to 100
      if(Math.floor(genRnd(1, 100)) === 50) audioObj.play('car');
    }

    if(direction === 'reset') {
      // scrollAnimateTo(canvas.height, 100);

      this.x = canvas.width / 2;
      this.y = canvas.height - this.h;

      this.reseted = true;
    }
  };
};

/**
 *  @name way
 *  @desc generates an way object
 */

var way = function (y1, y2) {

  this.y1 = y1;
  this.y2 = y2;
  this.height = this.y2 - this.y1;
  this.width = canvas.width;

  this.template = prt(this.width, this.height);
  this.templateCtx = this.template.getContext('2d');

  this.draw = function (destinationContext) {

    var img = new Image();

    img.onload = function () {

      for (var h = this.height / 32; h >= 0; h--) {
        for (var w = this.width / 32; w >= 0; w--) {
          this.templateCtx.drawImage(img, w * 32, h * 32);
        }
      }

      if(game.debug) {
        printBorder(this.templateCtx, this.width, this.height);
      }

      destinationContext.drawImage(this.template, 0, this.y1);
    }.bind(this);

    img.src = IMAGES.STREET;

    // clean
    this.templateCtx.clearRect(0, 0, this.width, this.height);
  };
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

var fpsMeter = function () {

  this._then = Date.now();
  this._fps = 0;
  this._fpsMeterNode = document.getElementById('fps');

  setInterval(function () {
    this._fpsMeterNode.innerHTML = this._fps;
    this._fps = 0;
  }.bind(this), 1000);

  this.isShowing = true;

  this.show = function () {
    if(!this.isShowing) {
      this.isShowing = true;
      this._fpsMeterNode.style.display = 'block';
    }
  };

  this.hide = function () {
    if(this.isShowing) {
      this.isShowing = false;
      this._fpsMeterNode.style.display = 'none';
    }
  };

  this.start = function () {
    this._now = Date.now();
    this.delta = this._now - this._then;

    this._fps++;
  };

  this.end = function () {
    this._then = this._now;
  };
};

/**
 *  @name audio
 *  @desc generates the audio object
 */

var audio = function () {

  var SOUNDS = ['move', 'dead', 'levelup', 'car'];

  this.path = 'audio/';

  this.nodes = {};

  for (var s = 0; s < SOUNDS.length; s++) {
    this.nodes[SOUNDS[s]] = document.createElement('audio');
    this.nodes[SOUNDS[s]].id = 'sound_' + SOUNDS[s];
    this.nodes[SOUNDS[s]].volume = 0.5;
    this.nodes[SOUNDS[s]].src = this.path + SOUNDS[s] +  '.wav';
    document.body.appendChild(this.nodes[SOUNDS[s]]);
  }

  this.play = function (soundId) {
    if(SOUNDS.indexOf(soundId) !== -1) {
      this.nodes[soundId].currentTime = 0;
      this.nodes[soundId].play();
    }
  };
};

// actions! yay!
// ------------------------------------------------------------------------------------------

var frockObj  = new frock();
var audioObj  = new audio();
var fpsMeterObj = new fpsMeter();

var statusScreen = new StatusScreen();

var obstacles = [];
var ways = [];
var blocks = [];

function update() {

  fpsMeterObj.start();

  if(game.debug) {
    fpsMeterObj.show();
  } else {
    fpsMeterObj.hide();
  }

  requestAnimFrame(update);

  if(!game.pause) {

    for(i = 0; i < obstacles.length; i++) {

      obstacles[i].drive(fpsMeterObj.delta);  // let the obstacle drive

      if(!frockObj.died) {
        frockObj.died = hits(
          frockObj.x,
          frockObj.y,
          frockObj.w,
          frockObj.h,
          obstacles[i].x,
          obstacles[i].y,
          obstacles[i].w,
          obstacles[i].h,
          1
        );

        if(frockObj.died) {

          if(game.lifes.value > 0) {
            statusScreen.show('<strong>' + (game.lifes.value - 1) + ' Lifes left</strong> <br>Press \'space\' to restart the Level')
          } else if(game.lifes.value === 0) {
            statusScreen.show('<strong>Game Over</strong> <br> Press \'space\' to restart the Game')
          }

          audioObj.play('dead');
        }
      }

    }
  }

  // level up
  if(frockObj.y < frockObj.h && !frockObj.d) {

    frockObj.move('reset');
    audioObj.play('levelup');

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

  fpsMeterObj.end();
}

function draw() {

  // clear canvas
  canvas.perFrame.clear();

  // draw frock
  frockObj.draw(canvas.perFrame.ctx);

  // draw blocks
  for(var b in blocks) blocks[b].draw(canvas.perFrame.ctx);

  // draw obstacles
  for(var o in obstacles) obstacles[o].draw(canvas.perFrame.ctx);
}

window.addEventListener('keydown', function (event) {

  event = event || window.event;
  var c = event.keyCode;
  var step = frockObj.h;

  // prevent scrolling, up, down, space
  if(c === 40 || c === 38 || c === 32) event.preventDefault();

  if(!game.pause && !frockObj.died) {

    // if(frockObj.y - frockObj.h * 3 < window.scrollY) {
    //   scrollAnimateTo(frockObj.y - frockObj.h * 3, 100);
    // }

    switch(c) {
      case 40: case 83: frockObj.move('down'); break;
      case 87: case 38: frockObj.move('up'); break;
      case 68: case 39: frockObj.move('right'); break;
      case 65: case 37: frockObj.move('left'); break;
      case 13: game.debug = !game.debug; break;
    }
  }

  // new game
  if(c == 32 && frockObj.died && game.lifes.value === 0) {

    frockObj.died = false;
    frockObj.move('reset');

    statusScreen.hide();

    game.pause = false;
    game.reset = true;

    game.lifes.update();
    game.level.update();
    game.level.draw();

  // new chance
  } else if(c == 32 && frockObj.died && game.lifes.value > 0) {

    frockObj.died = false;
    frockObj.move('reset');

    statusScreen.hide();

    game.newChance = true;
    game.pause = false;

    game.lifes.update();
    game.level.draw();

  // pause game, if space was pressed & frock is alive
  } else if(c == 32 && !frockObj.died) {
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

    gameNode.height = gameBackgroundNode.height = canvas.height;
    gameNode.width  = gameBackgroundNode.width = canvas.width;

    game.level.update();
    game.level.draw();

    update();

  });
}

window.addEventListener('DOMContentLoaded', init, false);
