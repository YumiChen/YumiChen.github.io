'use strict';

var width = window.innerWidth,
    height = window.innerHeight,
    pausing = true,
    filename,
    arrowsFly,
    arrowVals = [],

// doms
uploadUI = document.getElementsByClassName('uploadUI')[0],
    prepare = document.getElementsByClassName('prepare')[0],
    gameUI = document.getElementsByClassName('gameUI')[0],
    resultUI = document.getElementsByClassName('resultUI')[0],
    audioName = document.getElementById('audioName'),

// canvas related data
canvas,
    ctx,
    l,
    barNum = 100,
    barWidth = width / barNum,
    barX = 0,
    barsOpacity = 0,

// audio related data
sound = document.getElementById('sound'),
    context,
    source,
    analyser,
    fbcArray,
    gainNode,
    vals = ['', ''],
    executed = false,
    increasingScale = 0;

/*---handle uploaded audio---*/
input.onchange = function handleUpload(e) {
  sound.src = URL.createObjectURL(this.files[0]);
  filename = this.files[0].name;

  initGame();
};

/*---game inition, handling audio context---*/
function initGame() {
  // fill song name
  audioName.innerHTML = filename;

  // init audioContext
  context = new AudioContext();

  source = context.createMediaElementSource(sound);

  gainNode = context.createGain();
  analyser = context.createAnalyser();

  // actions to do when song ended
  source.mediaElement.addEventListener('ended', function () {
    pausing = true;

    clearInterval(arrowsFly);

    // gradually set cubes to the original size
    var graduallyScale = setInterval(function () {
      if (meshes[0].scale.x == 1) {
        clearInterval(graduallyScale);
      } else {
        meshes.forEach(function (mesh) {
          mesh.scale.set(increasingScale, increasingScale, increasingScale);
        });
        increasingScale += 0.5;
      }
    }, 100);

    generateFinalResult();
    showResult();
  });

  gainNode.gain.value = 2;

  // connect
  source.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(context.destination);

  prepareGame(source);
}

/*---UI handling---*/
function prepareGame(source) {
  // transition
  uploadUI.classList.add('hideUploadUI');
  prepare.style.display = 'block';
  setTimeout(function () {
    play(source);
  }, 3500);
}

function play(source) {
  pausing = false;

  // set timing to create arrows
  arrowsFly = setInterval(function () {
    if (arrowVals.length != 0 && pausing == false) {
      createArrow(getAverage(arrowVals) > 0.6);
    }
  }, 400);
  gameUI.style.display = 'block';

  frameLooper();
  source.mediaElement.play();
}

function showResult() {
  URL.revokeObjectURL(sound.src);
  // transition
  gameUI.classList.add('hideGameUI');
  setTimeout(function () {
    gameUI.style.display = 'none';
  }, 1000);

  // set final result- get dom
  var level = document.getElementsByClassName('level')[0],
      finalScore = document.getElementsByClassName('finalScore')[0],
      combos = document.getElementsByClassName('combos')[0];

  // set final result- fill data
  finalScore.innerHTML = finalResult.score;
  combos.innerHTML = finalResult.highestCombos;
  level.innerHTML = finalResult.level;

  // transition- enter
  resultUI.classList.add('resultEnter');
}

/*---handle Pausing---*/
function adjustVolume() {
  pausing = true;
  // generate volume panel
  volume();
  analyser.disconnect(context.destination);
}

function pauseGame() {
  pause();
  // generate pause panel
  pausing = true;analyser.disconnect(context.destination);
}

/*------frameLooper------*/
function frameLooper() {
  if (!pausing) {
    window.requestAnimationFrame(frameLooper);
    var fbcArray = new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteFrequencyData(fbcArray);

    // checkRemove();

    //  createArrow(
    // variance(fbcArray)>8000
    //  );

    // make the cubes to scale to the music
    var scaleVal = getVals(fbcArray) / 3;
    scale(scaleVal);

    // handle data for timings of creating arrows
    arrowVals.push(scaleVal);

    if (arrowVals.length >= 24) {
      arrowVals = [];
    }

    drawBars(fbcArray);
  } else {
    window.requestAnimationFrame(frameLooper);
  }
}

/*-------canvas-------*/
canvas = document.createElement('canvas');
ctx = canvas.getContext('2d');
canvas.className = "bars";

canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);

//draw bars
function drawBars(fbcArray) {
  if (!pausing) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,' + barsOpacity + ')';

    if (barsOpacity < 0.5) {
      barsOpacity += 0.003;
    }
    for (l = 0; l < barNum; l += 1) {
      var Barheight = -(fbcArray[l] / 2.5);
      ctx.fillRect(barX + l * barWidth, canvas.height, barWidth, Barheight);
      ctx.fill();

      ctx.fillRect(window.innerWidth - (l + 1) * barWidth, 0, barWidth, -Barheight);
      ctx.fill();
    }
  }
}

/*--Decide when to create arrows--*/
function getAverage(arr) {
  var sum = 0,
      result;
  arr.forEach(function (arr) {
    sum += arr;
  });
  result = sum / arr.length;
  return result;
}

function getVals(fbcArray) {
  var ave = getAverage(fbcArray);

  if (executed == false) {
    vals[0] = ave;
    executed = true;
    return;
  } else {
    vals[1] = ave;
    var differance;
  }
  differance = Math.abs(vals[0] - vals[1]);
  vals[0] = vals[1];
  delete vals[1];
  return differance;
}

function getNums(arr) {
  var nums = {
    highest: 0, lowest: ''
  };
  arr.forEach(function (arr) {
    if (arr > nums.highest) {
      nums.highest = arr;
    } else if (!nums.lowest) {
      nums.lowest = arr;
    } else if (arr < nums.lowest) {
      nums.lowest = arr;
    }
  });
  return nums;
}

function variance(arr) {
  var len = 0;var sum = 0;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == "") {} else if (typeof arr[i] != 'number') {
      alert(arr[i] + " is not number, Variance Calculation failed!");
      return 0;
    } else {
      len = len + 1;
      sum = sum + parseFloat(arr[i]);
    }
  }
  var v = 0;
  if (len > 1) {
    var mean = sum / len;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] == "") {} else {
        v = v + (arr[i] - mean) * (arr[i] - mean);
      }
    }
    return v / len;
  } else {
    return 0;
  }
}

/*---handle resize----*/
window.addEventListener('resize', onResize);

function onResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;
  barWidth = width / barNum;
  ctx.clearRect(0, 0, width, height);
  l = 0;

  renderer.setSize(width, height);
  center = { x: document.body.clientWidth / 2, y: document.body.clientHeight / 2 };
}

function transition(dom, phase) {
  if (phase == 'enter') {} else if (phase == 'leave') {}
}

function handleClass(dom, className1, className2) {
  dom.classList.remove(className1);
  dom.classList.remove(className2);
}