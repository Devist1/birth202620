/* ============================================================
   地球Online - 20级晋级庆典
   全部交互逻辑
   ============================================================

   ★ 可替换占位符：
   USER_NAME → 寿星名字（当前值：喻子懿）
   如需修改，请在下方修改该变量，同时同步修改 index.html 中的对应文本
   ============================================================ */

(function(){
  'use strict';

  /* ==================== 配置 ==================== */
  // ★ 修改寿星名字
  var USER_NAME = '喻子懿';

  /* ==================== 工具函数 ==================== */
  function $(id) { return document.getElementById(id); }

  /**
   * 屏幕切换：fromId → toId，带淡入淡出
   */
  function switchScreen(fromId, toId) {
    var from = $(fromId), to = $(toId);
    if (from) { from.classList.remove('active'); from.classList.add('fade-out'); }
    if (to)   { to.classList.add('active'); to.scrollTop = 0; }
    setTimeout(function() {
      if (from) from.classList.remove('fade-out');
    }, 600);
  }

  /* ================================================================
     SCREEN 1: 华丽升级动画
     ================================================================ */
  var canvas, ctx, particles = [], animId;
  var lv19El         = $('lv19El');
  var lv20El         = $('lv20El');
  var expBarEl       = $('expBar');
  var expPercentEl   = $('expPercent');
  var levelUpTextEl  = $('levelUpText');
  var levelSubTextEl = $('levelSubText');
  var continueBtn    = $('screen1Continue');

  function initParticles() {
    canvas = $('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /**
   * 一次粒子爆发：120个粒子从屏幕中央偏上位置向四周散开
   */
  function spawnBurstParticles() {
    if (!ctx) return;
    var cx = canvas.width / 2;
    var cy = canvas.height * 0.38;
    var colorPalette = ['#ffd700','#ffaa00','#00e5ff','#ff6b9d','#c084fc','#fff'];
    for (var i = 0; i < 120; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 6;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.006 + Math.random() * 0.015,
        size: 1.5 + Math.random() * 3.5,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)]
      });
    }
  }

  function updateParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;           // 重力
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function particleLoop() {
    updateParticles();
    if (particles.length > 0) {
      animId = requestAnimationFrame(particleLoop);
    } else {
      animId = null;
    }
  }

  function startParticles() {
    spawnBurstParticles();
    if (!animId) particleLoop();
    // 连续6轮爆发，每350ms一轮
    var burstCount = 0;
    var interval = setInterval(function() {
      burstCount++;
      if (burstCount > 5) { clearInterval(interval); return; }
      spawnBurstParticles();
      if (!animId) particleLoop();
    }, 350);
  }

  /**
   * 升级动画流程:
   *  Lv19 放大(boost) → 向下滑走(exit) + 粒子爆发
   *  → Lv20 从上方滑入(enter) → 恢复正常
   */
  function runLevelUpAnimation() {
    // 1) Lv19 放大
    lv19El.classList.add('boost');

    // 2) 500ms 后 Lv19 向下滑走 + 粒子爆发
    setTimeout(function() {
      lv19El.classList.add('exit');
      lv19El.classList.remove('boost');
      startParticles();
    }, 500);

    // 3) 同时 Lv20 从上方滑入 + BGM1 响起
    setTimeout(function() {
      lv20El.classList.add('enter');
      levelUpTextEl.classList.add('show');
      levelSubTextEl.classList.add('show');
    }, 650);

    // 4) 显示继续按钮
    setTimeout(function() {
      continueBtn.classList.add('show');
    }, 1200);
  }

  function animateExpBar() {
    expBarEl.style.width = '60%';
    expPercentEl.textContent = '60%';

    setTimeout(function() {
      expBarEl.style.width = '99%';
      expPercentEl.textContent = '99%';
    }, 600);

    setTimeout(function() {
      expBarEl.style.width = '100%';
      expBarEl.classList.add('filled');
      expPercentEl.textContent = '100%';
      runLevelUpAnimation();
    }, 1500);
  }

  function initScreen1() {
    initParticles();
    // 重置状态
    lv19El.classList.remove('boost', 'exit');
    lv20El.classList.remove('enter');
    expBarEl.style.width = '0%';
    expBarEl.classList.remove('filled');
    expPercentEl.textContent = '0%';
    levelUpTextEl.classList.remove('show');
    levelSubTextEl.classList.remove('show');
    continueBtn.classList.remove('show');

    // 不自动触发 — 等用户点击"开启晋级庆典"
  }

  // 点击开始按钮 → 播放BGM + 关闭遮罩 + 启动升级动画
  var startBtn = $('startBtn');
  var startOverlay = $('startOverlay');
  startBtn.addEventListener('click', function() {
    // 在用户手势中同时激活 bgm1 + bgm2 音频通道
    warmUpBothAudio();
    // 隐藏遮罩
    startOverlay.classList.add('hidden');
    // 启动升级动画
    setTimeout(animateExpBar, 300);
  }, { once: true });

  // “继续”按钮 → 第2屏
  continueBtn.addEventListener('click', function() {
    switchScreen('screen1', 'screen2');
  });

  /* ================================================================
     SCREEN 2: 过渡页
     ================================================================ */
  $('btnAccept').addEventListener('click', function() {
    switchScreen('screen2', 'screen3');
    initScreen3();
  });
  $('btnSerious').addEventListener('click', function() {
    switchScreen('screen2', 'screen3');
    initScreen3();
  });

  /* ================================================================
     SCREEN 3: 三道选择题
     ================================================================ */
  var quizData = [
    {
      question: '以下哪种食物是玩家dk讨厌的食物？',
      options: ['A. 黄瓜', 'B. 龙虾', 'C. 香菜'],
      correct: 2,
      tease: '玩家dk：答错了你以后就天天吃茄子吧😄'
    },
    {
      question: '以下哪个是玩家dk最近在玩的游戏？',
      options: ['A. 我的世界', 'B. 洛克王国', 'C. 鸣潮'],
      correct: 1,
      tease: '玩家dk：讨厌期末周，想玩游戏😭'
    },
    {
      question: '玩家dk的npc妹妹叫什么？',
      options: ['A. 邓雨菲', 'B. 邓宇飞', 'C. 邓雨霏'],
      correct: 0,
      tease: '玩家dk：有点难度，没事，错了我不告诉她'
    }
  ];
  var currentQ     = 0;
  var correctCount = 0;

  function initScreen3() {
    currentQ     = 0;
    correctCount = 0;
    updateProgress();
    renderQuestion();
  }

  function updateProgress() {
    var pct = Math.round((correctCount / 3) * 100);
    $('progressPercent').textContent = pct + '%';
    $('progressBar').style.width = pct + '%';

    // 三题全对 → 跳转第4屏
    if (correctCount >= 3) {
      setTimeout(function() {
        switchScreen('screen3', 'screen4');
        initScreen4();
      }, 700);
    }
  }

  function renderQuestion() {
    if (currentQ >= quizData.length) return;
    var q = quizData[currentQ];
    $('qNum').textContent   = '第 ' + (currentQ + 1) + '/3 题';
    $('qText').textContent  = q.question;
    $('qTease').textContent = q.tease;

    // 动态生成选项按钮
    var optHTML = '';
    q.options.forEach(function(opt, idx) {
      optHTML += '<button class="option-btn" data-idx="' + idx + '">' + opt + '</button>';
    });
    $('qOptions').innerHTML = optHTML;

    // 绑定点击事件
    var btns = $('qOptions').querySelectorAll('.option-btn');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        handleAnswer(idx, btns);
      });
    });
  }

  function handleAnswer(idx, btns) {
    var q = quizData[currentQ];
    if (idx === q.correct) {
      // ---- 正确 ----
      btns.forEach(function(b) { b.classList.add('disabled'); });
      btns[idx].classList.add('correct');
      correctCount++;
      updateProgress();
      // 600ms后切下一题
      setTimeout(function() {
        currentQ++;
        if (currentQ < quizData.length) {
          renderQuestion();
        }
      }, 600);
    } else {
      // ---- 错误 ----
      btns[idx].classList.add('wrong');
      showErrorModal();
    }
  }

  function showErrorModal() {
    $('errorModal').classList.add('show');
  }

  $('retryBtn').addEventListener('click', function() {
    $('errorModal').classList.remove('show');
    // 清除错误高亮（保留选项状态，只去掉红色标记）
    var btns = $('qOptions').querySelectorAll('.option-btn');
    btns.forEach(function(b) { b.classList.remove('wrong'); });
  });

  /* ================================================================
     SCREEN 4: 梦幻申请页
     ================================================================ */
  function initScreen4() {
    generateStars();
    // 重置卡片状态
    $('cardStep1').style.display = '';
    $('cardStep1').classList.remove('fading');
    $('cardStep2').style.display = 'none';
    $('cardStep2').classList.remove('fading');
  }

  function generateStars() {
    var container = $('screen4Stars');
    if (!container) return;
    var html = '';

    // 45颗闪烁星星
    for (var i = 0; i < 45; i++) {
      var x     = Math.random() * 100;
      var y     = Math.random() * 100;
      var dur   = 1.2 + Math.random() * 2.5;
      var delay = Math.random() * 3;
      var size  = 1.5 + Math.random() * 2.5;
      html += '<div class="star" style="left:' + x + '%;top:' + y + '%;width:' + size +
              'px;height:' + size + 'px;--dur:' + dur + 's;--delay:' + delay + 's;"></div>';
    }

    // 12个漂浮爱心气泡
    var hearts = ['💕','💖','💗','💝','✨','💫','🫧'];
    for (var j = 0; j < 12; j++) {
      var hx    = 5 + Math.random() * 90;
      var hy    = 40 + Math.random() * 60;
      var hdur  = 3 + Math.random() * 5;
      var hdelay = Math.random() * 6;
      html += '<div class="heart-float" style="left:' + hx + '%;top:' + hy +
              '%;--dur:' + hdur + 's;--delay:' + hdelay + 's;">' +
              hearts[Math.floor(Math.random() * hearts.length)] + '</div>';
    }
    container.innerHTML = html;
  }

  // 点击"📩 查看"
  $('btnView').addEventListener('click', function() {
    var step1 = $('cardStep1');
    var step2 = $('cardStep2');
    step1.classList.add('fading');
    setTimeout(function() {
      step1.style.display = 'none';
      step2.style.display = '';
      step2.classList.remove('fading');
    }, 500);
  });

  // 点击"💗 我愿意" → 第5屏
  $('btnIWish').addEventListener('click', function() {
    switchScreen('screen4', 'screen5');
    initScreen5();
  });

  /* ================================================================
     SCREEN 5: 终极祝福界面（附 Canvas 爱心粒子）
     ================================================================ */
  var s5Canvas, s5Ctx, s5Hearts = [], s5AnimId;

  function initScreen5() {
    // 切换到第二首BGM
    playBGM2();
    // 重置信封和信纸状态
    var envWrap = $('envelopeWrap');
    var envEl   = $('envelopeEl');
    envWrap.classList.remove('opening');
    envWrap.style.display = '';
    envWrap.style.opacity = '1';
    envWrap.style.transform = '';
    envEl.classList.remove('flap-open');
    $('letter1Reveal').classList.remove('revealed');
    $('letter2Reveal').classList.remove('revealed');
    // 启动 Canvas 爱心粒子
    initScreen5Canvas();
    // 生成彩带/爱心飘落
    generateConfetti();
  }

  function initScreen5Canvas() {
    s5Canvas = $('screen5Canvas');
    if (!s5Canvas) return;
    s5Ctx = s5Canvas.getContext('2d');
    s5Hearts = [];
    resizeScreen5Canvas();
    window.addEventListener('resize', resizeScreen5Canvas);
    if (!s5AnimId) s5HeartLoop();
  }

  function resizeScreen5Canvas() {
    if (!s5Canvas) return;
    s5Canvas.width  = window.innerWidth;
    s5Canvas.height = window.innerHeight;
  }

  function drawHeart(ctx, x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#b388ff';
    ctx.shadowColor = 'rgba(156,39,176,0.5)';
    ctx.shadowBlur = size * 2.5;
    ctx.beginPath();
    var s = size;
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.3);
    ctx.bezierCurveTo(x - s, y + s * 0.65, x, y + s * 0.85, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.85, x + s, y + s * 0.65, x + s, y + s * 0.3);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function spawnScreen5Heart() {
    if (!s5Canvas) return;
    s5Hearts.push({
      x: Math.random() * s5Canvas.width,
      y: s5Canvas.height + 20,
      vy: -(0.6 + Math.random() * 1.2),
      vx: (Math.random() - 0.5) * 0.4,
      size: 5 + Math.random() * 12,
      life: 1,
      decay: 0.003 + Math.random() * 0.006,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.025
    });
  }

  function updateScreen5Hearts() {
    if (!s5Ctx || !s5Canvas) return;
    s5Ctx.clearRect(0, 0, s5Canvas.width, s5Canvas.height);
    for (var i = s5Hearts.length - 1; i >= 0; i--) {
      var h = s5Hearts[i];
      h.y += h.vy;
      h.sway += h.swaySpeed;
      h.x += Math.sin(h.sway) * 0.35;
      h.life -= h.decay;
      if (h.life <= 0 || h.y < -40) {
        s5Hearts.splice(i, 1);
        continue;
      }
      drawHeart(s5Ctx, h.x, h.y, h.size, h.life * 0.6);
    }
  }

  function s5HeartLoop() {
    updateScreen5Hearts();
    // 持续生成爱心
    if (s5Hearts.length < 25 && Math.random() < 0.5) {
      spawnScreen5Heart();
    }
    s5AnimId = requestAnimationFrame(s5HeartLoop);
  }

  function generateConfetti() {
    var wrap = $('confettiWrap');
    if (!wrap) return;
    var html = '';
    var colors = [
      '#ffd700','#ff6b9d','#c084fc','#00e5ff','#ff8a65',
      '#81c784','#ffb74d','#f8bbd0','#ce93d8','#fff176'
    ];

    // 40个彩带
    for (var i = 0; i < 40; i++) {
      var x     = Math.random() * 100;
      var dur   = 3 + Math.random() * 6;
      var delay = Math.random() * 8;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var w     = 5 + Math.random() * 10;
      var h     = 4 + Math.random() * 8;
      html += '<div class="confetti" style="left:' + x + '%;background:' + color +
              ';width:' + w + 'px;height:' + h + 'px;--dur:' + dur + 's;--delay:' + delay + 's;"></div>';
    }

    // 15个漂浮emoji（爱心/气球/星星）
    var emojis = ['❤️','💕','💖','✨','🌟','🎈','🎉','🎊','💝','🫧'];
    for (var j = 0; j < 15; j++) {
      var hx    = Math.random() * 100;
      var hdur  = 4 + Math.random() * 6;
      var hdelay = Math.random() * 8;
      html += '<div class="heart-particle" style="left:' + hx +
              '%;--dur:' + hdur + 's;--delay:' + hdelay + 's;">' +
              emojis[Math.floor(Math.random() * emojis.length)] + '</div>';
    }
    wrap.innerHTML = html;
  }

  // ---- 信封点击 → 打开封口 → 信纸从信封中滑出 ----
  $('envelopeWrap').addEventListener('click', function() {
    var envWrap = $('envelopeWrap');
    var envEl   = $('envelopeEl');
    var l1Rev   = $('letter1Reveal');

    // 已经打开过则忽略
    if (envWrap.classList.contains('opening')) return;
    envWrap.classList.add('opening');

    // 1. 封口打开动画
    setTimeout(function() {
      envEl.classList.add('flap-open');
    }, 200);

    // 2. 信封缩小消失 + 信纸从信封口滑出
    setTimeout(function() {
      envWrap.style.display = 'none';
      l1Rev.classList.add('revealed');
    }, 700);
  });

  // ---- 展开碎碎念 → 第二张信纸 ----
  $('btnExpandNote').addEventListener('click', function() {
    var l1Rev = $('letter1Reveal');
    var l2Rev = $('letter2Reveal');
    // 收起第一张
    l1Rev.classList.remove('revealed');
    // 展开第二张
    setTimeout(function() {
      l2Rev.classList.add('revealed');
      // 滚动到第二张信纸
      l2Rev.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  });

  // ---- 珍藏按钮 → 弹窗 ----
  $('btnTreasure').addEventListener('click', function() {
    $('finalModal').classList.add('show');
    setTimeout(function() {
      $('finalModal').classList.remove('show');
    }, 2000);
  });

  // 点击弹窗遮罩也可关闭
  $('finalModal').addEventListener('click', function() {
    this.classList.remove('show');
  });

  /* ==================== 背景音乐 ==================== */
  var bgm1 = $('bgm1');
  var bgm2 = $('bgm2');

  // 在用户手势中同时激活两个音频通道（移动端/微信必须）
  function warmUpBothAudio() {
    if (bgm1) {
      bgm1.load();
      bgm1.currentTime = 0;
      bgm1.play().catch(function(){});
    }
    if (bgm2) {
      bgm2.load();
      bgm2.currentTime = 0;
      var p2 = bgm2.play();
      if (p2 && p2.then) {
        p2.then(function() {
          bgm2.pause();
          bgm2.currentTime = 0;
        }).catch(function(){});
      } else {
        // 同步播放成功，立即暂停
        bgm2.pause();
        bgm2.currentTime = 0;
      }
    }
  }

  function playBGM2() {
    if (!bgm2) return;
    // BGM1 淡出
    if (bgm1 && !bgm1.paused) {
      fadeOutVolume(bgm1, 200, function() {
        bgm1.pause();
      });
    }
    // BGM2 淡入
    bgm2.volume = 0;
    bgm2.currentTime = 0;
    var p = bgm2.play();
    var startFade = function() {
      fadeInVolume(bgm2, 400);
    };
    if (p && p.then) {
      p.then(startFade).catch(function(){});
    } else {
      startFade();
    }
  }

  function fadeInVolume(audio, duration) {
    audio.volume = 0;
    var step = 30;
    var steps = Math.floor(duration / step);
    var delta = 1 / steps;
    var n = 0;
    var timer = setInterval(function() {
      n++;
      audio.volume = Math.min(1, n * delta);
      if (n >= steps) clearInterval(timer);
    }, step);
  }

  function fadeOutVolume(audio, duration, callback) {
    var startVol = audio.volume;
    var step = 30;
    var steps = Math.floor(duration / step);
    var delta = startVol / steps;
    var n = 0;
    var timer = setInterval(function() {
      n++;
      audio.volume = Math.max(0, startVol - n * delta);
      if (n >= steps) {
        clearInterval(timer);
        if (callback) callback();
      }
    }, step);
  }

  /* ==================== 启动 ==================== */
  initScreen1();

})();