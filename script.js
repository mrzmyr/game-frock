var gameNode = document.getElementById('gameCanvas');
var gameBackgroundNode = document.getElementById('gameCanvasBackground');

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

  level: {

    value: 1,
    node: document.getElementById('level'),

    update: function (lvl) {

      switch(lvl) {
        case 'up' : this.value += 1; break;
        case 'reset': this.value = 1; break;
      }

      this.node.innerHTML = 'Level: <span>' + this.value + '</span>';
    },

    generate: function () {

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

        var y1    = nextStart - 1;
        var y2    = waySpaceCoords[s];
        nextStart   = waySpaceCoords[s] + 2;

        if(s == waySpaceCoords.length-1) y2 = 19; // end up with last line to bottom

        ways.push(new way(y1 * 32, y2 * 32, true)); // x, y, l, h, w

        // adding the blocks
        // ---------------------------------

        if(this.value > 1 && s != waySpaceCoords.length-1) { // after first level & wothout last line

          var coords = [];
          var coordsPossible = [];
          var blocksCount = Math.floor((this.value >= 37 ? 36 : this.value));

          // hate doubles
          for(bc = 1; bc <= 19; bc++) coordsPossible.push(bc); // push all possibilities
          for(i = 0; i < blocksCount; i++) coords.push(coordsPossible.splice(Math.floor(Math.random() * coordsPossible.length - 1), 1)[0]); // push only possibles

          var y = waySpaceCoords[s];

          for(c = 0; c < coords.length; c++) blocks.push(new block(coords[c]*32, y*32));

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
          var speed = 0.1 * this.value + 0.1;
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

      // finally draw the objects we created
      // -------------------------------------

      canvas.perLevel.clear();

      var img = new Image();

      img.onload = function () {
        for (var h = canvas.perLevel.node.height / 32; h >= 0; h--) {
          for (var w = canvas.perLevel.node.width / 32; w >= 0; w--) {
            canvas.perLevel.ctx.drawImage(img, w * 32, h * 32);
          }
        }
      }.bind(this);

      img.src = 'img/gras.png';

      // draw ways
      for(w in ways) ways[w].draw(canvas.perLevel.ctx);
    }
  },

  lifes: {
    value: 3,
    nodes: document.getElementById('lifes').getElementsByTagName('img'),

    update: function (lifes) {

      switch(lifes) {
        case 'up': this.value += 1; break;
        case 'down': this.value -= 1; break;
        case 'reset': this.value = 3; break;
      }

      for(i = 0; i < 3; i++) this.nodes[i].src = 'img/life_inv.png';
      for(i = 0; i < this.value; i++) this.nodes[i].src = 'img/life.png';
    }
  },

  status: {
    node: document.getElementById('status'),
    value: '',

    onchange: function () {
      this.node.classList.remove('animation');
      this.node.classList.add('animation');
      setTimeout(function () {
        this.node.classList.remove('animation');
      }.bind(this), 500);
    },

    update: function (v) {
      this.onchange();
      this.value = v;
      this.node.innerHTML = this.value;
    }
  }

}

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
}

// some useful functions
// ------------------------------------------------------------------------------------------

// var parameterRange = function(min, max, value, step) {
//
//  this.id   = Math.floor(Math.random()*100);
//  this.node   = document.createElement('input');
//  this.value  = value;
//
//  this.node.type  = 'range';
//  this.node.min   = min;
//  this.node.max   = max;
//  this.node.value = value;
//  this.node.step  = step;
//  this.node.style.width = '100%';
//
//  var self = this;
//
//  this.node.onchange = function () {
//    self.value = self.node.value;
//  };
//
//  document.body.appendChild(this.node);
// };

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

  var border = border || 0;

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

  }

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
        case 1: img.src = 'img/motorbike.png'; break;
        case 2: img.src = 'img/car.png'; break;
        case 3: img.src = 'img/car2.png'; break;
        case 4: img.src = 'img/car3.png'; break;
        case 5: img.src = 'img/truck.png'; break;
      }

    }

    // put pre rendered canvas on canvas
    destContext.drawImage(this.tpl, this.x, this.y);
  }
}

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

    if(img === undefined || this.reseted) {

      this.reseted = false;

      img = new Image();

      img.onload = function () {
        this.templateCtx.clearRect(0, 0, this.w, this.h);
        this.templateCtx.drawImage(img, 0, 0);
      }.bind(this);

      if(!this.died) {
        img.src = 'img/frock.png';
      } else {
        img.src = 'img/frock_dead.png';
      }
    }

    // put pre rendered canvas on canvas
    destinationContext.drawImage(this.template, this.x, this.y);
  }

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

      audioObj.play('move');

      // play random car meep audio - chance 1 to 100
      if(Math.floor(genRnd(1, 100)) === 50) audioObj.play('car');
    }

    if(direction === 'reset') {
      scrollAnimateTo(canvas.height, 100);

      this.x = canvas.width / 2;
      this.y = canvas.height - this.h;

      this.reseted = true;
    }
  }

}

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

    img.src = 'img/street.png';

    // clean
    this.templateCtx.clearRect(0, 0, this.width, this.height);
  }
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

      img.src = 'img/stone.png';
    }

    // put pre rendered canvas on canvas
    destinationContext.drawImage(this.template, this.x, this.y);
  }

}

var fpsMeter = function () {
  this._then = Date.now();
  this._fps = 0;
  this._fpsMeterNode = document.getElementById('fps');

  setInterval(function () {
    this._fpsMeterNode.innerHTML = this._fps;
    this._fps = 0;
  }.bind(this), 1000);

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

  this.path = 'audio/';
  this.mute = true;

  this.init = function () {

    this.node = document.createElement('audio');
    this.node.id = 'sounds';
    this.node.volume = 0.5;

    this.toggleMute();

    document.body.appendChild(this.node);

    var self = this;

  }

  this.toggleMute = function () {
    this.mute = !this.mute
    document.getElementById('mute').innerHTML = (this.mute ? 'OFF' : 'ON');
  }

  this.play = function (s) {

    if(this.mute) return; // no sound on mute

    var self = this;

    switch(s) {
      case 'move': this.node.src = this.path + 'move.wav'; break;
      case 'dead': this.node.src = this.path + 'dead.wav'; break;
      case 'levelup': this.node.src = this.path + 'levelup.mp3'; break;
      case 'car': this.node.src = this.path + 'car.wav'; break;
    }

    this.node.addEventListener('canplay', self.node.play, false);

  }
}

// actions! yay!
// ------------------------------------------------------------------------------------------

var frockObj  = new frock();
var audioObj  = new audio();
var fpsMeterObj = new fpsMeter();

var obstacles   = [];
var ways    = [];
var blocks    = [];

function update() {

  fpsMeterObj.start();

  requestAnimFrame(update);

  if(!game.pause) {

    for(i = 0; i < obstacles.length; i++) {
      obstacles[i].drive(fpsMeterObj.delta);  // let the obstacle driving
      frockObj.died = frockObj.died || hits(frockObj.x, frockObj.y, frockObj.w, frockObj.h, obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h, 1);
    }

    if(frockObj.died) {
      audioObj.play('dead');
      game.pause = true;
    }
  }

  // level up
  if(frockObj.y < frockObj.h && !frockObj.d) {

    frockObj.move('reset');
    audioObj.play('levelup'); // play sound

    game.level.update('up');
    game.status.update('Level up');
    game.level.generate();
  }

  draw();

  fpsMeterObj.end();
}

function draw() {

  // clear canvas
  canvas.perFrame.clear();

  // print out, debug lines
  if(game.debug) {
    var max = (canvas.height / 32);

    for(i = 0; i < max + 1; i++) {
      canvas.perFrame.ctx.moveTo(0, i * 32);
      canvas.perFrame.ctx.lineTo(canvas.width, i * 32);
    }
    canvas.perFrame.ctx.stroke();
  }

  // draw frock
  frockObj.draw(canvas.perFrame.ctx);

  // draw blocks
  for(b in blocks) blocks[b].draw(canvas.perFrame.ctx);

  // draw obstacles
  for(var o in obstacles) obstacles[o].draw(canvas.perFrame.ctx);
}



// window.onfocus = function () { game.pause = false; }
// window.onblur = function () { game.pause = true; }

window.onkeydown = function (event) {

  event = event || window.event;
  var c = event.keyCode;
  var step = frockObj.h;

  // prevent scrolling, up, down, space
  if(c === 40 || c === 38 || c === 32) event.preventDefault();

  if(!game.pause) {
    if(frockObj.y - frockObj.h * 3 < window.scrollY) {
      scrollAnimateTo(frockObj.y - frockObj.h * 3, 100);
    }

    switch(c) {
      case 40: case 83: frockObj.move('down'); break;
      case 87: case 38: frockObj.move('up'); break;
      case 68: case 39: frockObj.move('right'); break;
      case 65: case 37: frockObj.move('left'); break;
      case 13: game.debug = !game.debug; break;
    }
  }

  // toggle sounds / music
  if(c == 77) audioObj.toggleMute();

  // new game
  if(c == 27 && frockObj.died && game.pause && game.lifes.value == 0) {

    frockObj.died = false;
    frockObj.move('reset');

    game.pause = false;
    game.lifes.update('reset');

    game.level.update('reset');
    game.level.generate();
  }

  // new chance
  if(c == 82 && frockObj.died && game.pause && game.lifes.value > 0) {

    frockObj.died = false;
    frockObj.move('reset');

    game.pause = false;
    game.lifes.update('down');
    game.level.generate();
  }

  // pause game, if space was pressed & frock is alive
  if(c == 32 && !frockObj.died) {
    game.pause = !game.pause;
    game.status.update(game.pause ? 'pause' : 'running');
  }
}

function init () {

  // sizing canvas
  gameNode.height = gameBackgroundNode.height = canvas.height;
  gameNode.width  = gameBackgroundNode.width = canvas.width;

  canvas.perLevel.clear();

  game.level.update();
  game.level.generate();

  audioObj.init();
}

init();
update();

