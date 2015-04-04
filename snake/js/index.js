var engine;
var canvas;
var ctx;

// 렌더링 속성을 담고 있는 객체
function RenderComponent(color, fillColor) {
  this.color = color || "#ff0000";
  this.fillColor = fillColor;
  this.previous = {
    x: -1,
    y: -1 // width, height의 바뀜은 고려하지 않음
  };
}

// AABB 충돌도 구현하게 된다.
function PositionComponent(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
}

PositionComponent.prototype.getRight = function() {
  return this.x + this.w;
}

PositionComponent.prototype.getLeft = function() {
  return this.x;
}

PositionComponent.prototype.getBottom = function() {
  return this.y + this.h;
}

PositionComponent.prototype.getTop = function() {
  return this.y;
}

PositionComponent.prototype.intersects = function(o) {
  return !(this.getRight() < o.getLeft() || this.getLeft() > o.getRight()
        || this.getTop() > o.getBottom() || this.getBottom() < o.getTop());
}

PositionComponent.prototype.intersection = function(o) {
  var x2 = Math.min(this.getRight(), o.getRight());
  var y2 = Math.min(this.getBottom(), o.getBottom());
  var x1 = Math.max(this.getLeft(), o.getLeft());
  var y1 = Math.max(this.getTop(), o.getTop());
  return new Rectangle(x1, y1, x2-x1, y2-y1);
}

PositionComponent.prototype.contains = function(x, y) {
  return x > this.getLeft() && x < this.getRight() && y > this.getTop()
    && y < this.getBottom();
}

// 물리!
function PhysicsComponent(mass, restitution, friction, ignore) {
  this.mass = mass || 3;
  this.restitution = restitution || 0.5;
  this.friction = friction || 0.3;
  this.ignore = ignore || [];
}

var Rectangle = PositionComponent;

// 가속도를 나타내는 객체
function VelocityComponent(x, y) {
  this.x = x || 0;
  this.y = y || 0;
  this.onGround = 0;
}

// 조종 가능한 객체
function ControllerComponent() {
}

// 뒤따라다님
function FollowComponent(parent, range, modify) {
  this.parent = parent;
  this.range = range || 100;
  this.modify = modify;
}

// 눌려진 키 저장소
var keys = {};

var Key = {
  UP: 38,
  LEFT: 37,
  DOWN: 40,
  RIGHT: 39,
  SPACE: 32
}

function handleKeyDown(e) {
  keys[e.keyCode] = 1;
}

function handleKeyUp(e) {
  keys[e.keyCode] = 0;
}

window.onload = function() {
  var span = document.createElement('div');
  document.body.appendChild(span);
  canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;
  ctx = canvas.getContext('2d');
  engine = new Engine();
  var ground = new Entity(engine);
  ground.add(new PositionComponent(0, 480, 800, 120));
  ground.add(new RenderComponent("#66dd44"));
  ground.add(new PhysicsComponent(Infinity));
  engine.addEntity(ground);
  var ground = new Entity(engine);
  ground.add(new PositionComponent(100, 300, 200, 50));
  ground.add(new RenderComponent("#66dd44"));
  ground.add(new PhysicsComponent(Infinity));
  engine.addEntity(ground);
  var ground = new Entity(engine);
  ground.add(new PositionComponent(0, -100, 800, 100));
  ground.add(new RenderComponent("#66dd44"));
  ground.add(new PhysicsComponent(Infinity));
  engine.addEntity(ground);
  var ground = new Entity(engine);
  ground.add(new PositionComponent(-100, 0, 100, 600));
  ground.add(new RenderComponent("#66dd44"));
  ground.add(new PhysicsComponent(Infinity));
  engine.addEntity(ground);
  var ground = new Entity(engine);
  ground.add(new PositionComponent(800, 0, 100, 600));
  ground.add(new RenderComponent("#66dd44"));
  ground.add(new PhysicsComponent(Infinity));
  engine.addEntity(ground);
  var character = new Entity(engine);
  character.add(new PositionComponent(100, 100, 30, 30));
  character.add(new RenderComponent("#f00"));
  character.add(new VelocityComponent(0, 0));
  character.add(new PhysicsComponent(50, 0.5, 0.1));
  character.add(new ControllerComponent());
  this.engine.addEntity(character);
  for(var j = 0; j < 4; ++j) {
    for(var i = 0; i < 4; ++i) {
      var prop = new Entity(engine);
      prop.add(new PositionComponent(700 - j * 30, 470 - i * 50, 30, 30));
      prop.add(new RenderComponent("#00f"));
      prop.add(new VelocityComponent(0, 0));
      prop.add(new PhysicsComponent(3));
      this.engine.addEntity(prop);
    }
  }
  var ignores = [];
  var latest = character;
  for(var i = 0; i < 20; ++i) {
    ignores.push(latest);
    var tail = new Entity(engine);
    tail.add(new PositionComponent(100, 70 - i * 30, 30, 30));
    tail.add(new RenderComponent("#f44"));
    tail.add(new PhysicsComponent(1, 0.5, 0.1, [latest]));
    tail.add(new VelocityComponent(0, 0));
    tail.add(new FollowComponent(latest, 30, i > 0));
    this.engine.addEntity(tail);
    latest = tail;
  }
  /*engine.addSystem({
    onAddedToEngine: function(engine) {
      this.engine = engine;
      this.ticks = 0;
    },
    update: function() {
      if(this.ticks%60 == 0) {
        var character = new Entity(engine);
        character.add(new PositionComponent(Math.random()*800, 0, 30, 30));
        character.add(new RenderComponent("#"+(Math.random()*0xFFFFFF|0).toString(16)));
        character.add(new VelocityComponent((Math.random()*2-1)*6, 3));
        character.add(new PhysicsComponent(3));
        this.engine.addEntity(character);
      }
      this.ticks ++;
    }
  })*/
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(FollowComponent, PositionComponent, VelocityComponent, PhysicsComponent).build());
    }, update: function() {
      //for(var i = 0; i < 10; ++i) {
      this.entities.forEach(function(entity) {
        var posComp = entity.get(PositionComponent);
        var velComp = entity.get(VelocityComponent);
        var folComp = entity.get(FollowComponent);
        var phyComp = entity.get(PhysicsComponent);
        var parent = folComp.parent;
        if(parent == null) return;
        var parentPos = parent.get(PositionComponent);
        var parentVel = parent.get(VelocityComponent);
        if(parentPos == null) return;
        velComp.onGround = 0;
        var parentPhy = entity.get(PhysicsComponent);
        var parentX = parentPos.x + parentPos.w / 2;
        var parentY = parentPos.y + parentPos.h / 2;
        var currentX = posComp.x + posComp.w / 2;
        var currentY = posComp.y + posComp.h / 2;
        var diffX = currentX - parentX;
        var diffY = currentY - parentY;
        var distance = Math.sqrt(diffX * diffX + diffY * diffY);
        var angle = Math.atan2(diffY, diffX);
        var disDiff = distance - folComp.range;
        var norm = disDiff;
        if(folComp.modify) norm *= 0.5;
        diffX = Math.cos(angle) * norm;
        diffY = Math.sin(angle) * norm;
        posComp.x -= diffX;
        posComp.y -= diffY;
        velComp.x -= diffX;
        velComp.y -= diffY;
        
        if(folComp.modify) {
          parentVel.x += diffX;
          parentVel.y += diffY;
          parentPos.x += diffX;
          parentPos.y += diffY;
        }
        
        /*var massSum = phyComp.mass + parentPhy.mass;
        var amount = parentPhy.mass / massSum;
        var parentAmount = phyComp.mass / massSum;
        var energySumX = 0, energySumY = 0;
        energySumX += velComp.x * phyComp.mass;
        energySumY += velComp.y * phyComp.mass;
        energySumX += parentVel.x * phyComp.mass;
        energySumY += parentVel.y * phyComp.mass;
        velComp.x = energySumX * amount / phyComp.mass;
        velComp.y = energySumY * amount / phyComp.mass;
        parentVel.x = energySumX * parentAmount / phyComp.mass;
        parentVel.y = energySumY * parentAmount / phyComp.mass;*/
        //if(distance > folComp.range) {
          //posComp.x = parentX + Math.cos(angle) * folComp.range;
          //posComp.y = parentY + Math.sin(angle) * folComp.range;
        //}
      });
      //}
    },
    priority: 300
  });
  // 입력
  /*document.addEventListener("keydown", handleKeyDown, false);
  document.addEventListener("keyup", handleKeyUp, false);
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(ControllerComponent, PositionComponent).build());
    },
    update: function() {
      this.entities.forEach(function(entity) {
        var velComp = entity.get(VelocityComponent);
        span.innerHTML = velComp.x.toFixed(2) + ',' + velComp.y.toFixed(2) + ',' + velComp.onGround
        if(keys[Key.LEFT]) {
          velComp.x -= 0.2;
        }
        if(keys[Key.RIGHT]) {
          velComp.x += 0.2;
        }
        if(keys[Key.UP]) {
          velComp.y -= 0.2;
        }
        if(keys[Key.DOWN]) {
          velComp.y += 0.2;
        }
        if(keys[Key.SPACE] && velComp.onGround < 2) {
          velComp.y = -10;
        }
      });
    }
  });*/
  var wantX = 300; wantY = 300;
  canvas.addEventListener('mousemove', function(evt) {
    var rect = canvas.getBoundingClientRect();
    wantX = evt.clientX - rect.left;
    wantY = evt.clientY - rect.top;
  });
  var clickEntities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
    .contain(PositionComponent, VelocityComponent, PhysicsComponent).build());
  document.addEventListener('keydown', function(evt) {
    var rect = canvas.getBoundingClientRect();
    //var px = evt.clientX - rect.left;
    //var py = evt.clientY - rect.top;
    var px = wantX;
    var py = wantY;
    clickEntities.forEach(function(entity) {
      //if(entity.get(PositionComponent).contains(px, py)) {
        var posComp = entity.get(PositionComponent);
        var velComp = entity.get(VelocityComponent);
        velComp.x += (px - posComp.x)/7;
        velComp.y += (py - posComp.y)/7;
      //}
    });
  });
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(ControllerComponent, PositionComponent).build());
    },
    update: function() {
      this.entities.forEach(function(entity) {
        var velComp = entity.get(VelocityComponent);
        var posComp = entity.get(PositionComponent);
        var posX = posComp.x + posComp.w / 2;
        var posY = posComp.y + posComp.h / 2;
        velComp.x += ((wantX - posX) / 10-velComp.x)/10;
        velComp.y += ((wantY - posY) / 10-velComp.y)/10;
        
      });
    }
  });
  // 렌더러
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(RenderComponent, PositionComponent).build());
      ctx.fillStyle = "#66aaff";
      ctx.fillRect(0, 0, 800, 600);
    },
    update: function() {
      ctx.fillStyle = "#66aaff";
      ctx.fillRect(0, 0, 800, 600);
      /*this.entities.forEach(function(entity) {
        var posComp = entity.get(PositionComponent);
        var renderComp = entity.get(RenderComponent);
        if(renderComp.previous.x != posComp.x|0 || renderComp.previous.y != posComp.y|0) {
          // 초기화
          ctx.fillStyle = "#66aaff";
          ctx.fillRect(renderComp.previous.x|0, renderComp.previous.y|0, posComp.w, posComp.h);
        }
      });*/
      this.entities.forEach(function(entity) {
        var posComp = entity.get(PositionComponent);
        var renderComp = entity.get(RenderComponent);
        //if(renderComp.previous.x != posComp.x|0 || renderComp.previous.y != posComp.y|0) {
          ctx.fillStyle = renderComp.color;
          ctx.fillRect(posComp.x|0, posComp.y|0, posComp.w, posComp.h);
          //ctx.fillStyle = renderComp.fillColor || renderComp.color;
          //ctx.fillRect((posComp.x|0) + 2, (posComp.y|0) + 2, posComp.w - 4, posComp.h - 4);
          renderComp.previous.x = posComp.x|0;
          renderComp.previous.y = posComp.y|0;
        //}
      });
    },
    priority: 1000
  });
  // 체인 그림
  /*engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(FollowComponent, RenderComponent, PositionComponent).build());
    },
    update: function() {
      this.entities.forEach(function(entity) {
        var posComp = entity.get(PositionComponent);
        var folComp = entity.get(FollowComponent);
        var renderComp = entity.get(RenderComponent);
        var parent = folComp.parent;
        if(parent == null) return;
        var parentPos = parent.get(PositionComponent);
        if(parentPos == null) return;
        var parentX = parentPos.x + parentPos.w / 2;
        var parentY = parentPos.y + parentPos.h / 2;
        var currentX = posComp.x + posComp.w / 2;
        var currentY = posComp.y + posComp.h / 2;
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(parentX|0, parentY|0);
        ctx.lineTo(currentX|0, currentY|0);
        ctx.stroke();
      });
    },
    priority: 1200
  });*/
  // 가속도
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(VelocityComponent, PositionComponent).build());
    },
    update: function() {
      this.entities.forEach(function(entity) {
        var posComp = entity.get(PositionComponent);
        var velComp = entity.get(VelocityComponent);
        posComp.x += velComp.x;
        posComp.y += velComp.y;
      });
    },
    priority: 200
  });
  // 물리
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(VelocityComponent, PhysicsComponent).build());
    },
    update: function() {
      this.entities.forEach(function(entity) {
        var phyComp = entity.get(PhysicsComponent);
        var velComp = entity.get(VelocityComponent);
        velComp.y += 0.2;
        velComp.y *= 0.98;
        velComp.x *= 0.98;
        velComp.onGround ++;
        if(velComp.y > 10) {
          //velComp.y = -10;
        }
      });
    },
    priority: 202
  });
  // 충돌 검사!!
  engine.addSystem({
    onAddedToEngine: function(engine) {
      this.entities = engine.getEntitiesFor(ComponentGroup.createBuilder(engine)
        .contain(PositionComponent, PhysicsComponent).build());
    },
    update: function() {
      for(var i = 0; i < this.entities.length; ++i) {
        var current = this.entities[i];
        var currentVel = current.get(VelocityComponent);
        var currentPos = current.get(PositionComponent);
        var currentPhy = current.get(PhysicsComponent);
        for(var j = i+1; j < this.entities.length; ++j) {
          var target = this.entities[j];
          var targetVel = target.get(VelocityComponent);
          var targetPos = target.get(PositionComponent);
          var targetPhy = target.get(PhysicsComponent);
          if(currentPhy.ignore.indexOf(target) != -1) continue;
          if(targetPhy.ignore.indexOf(current) != -1) continue;
          if(targetVel == null && currentVel == null) continue;
          if(currentPos.intersects(targetPos)) {
            var energyDirX = 0, energyDirY = 0;
            var massSum = currentPhy.mass + targetPhy.mass;
            var intersection = currentPos.intersection(targetPos);
            var currentAmount = targetPhy.mass / massSum;
            var targetAmount = currentPhy.mass / massSum;
            if(isNaN(currentAmount)) currentAmount = 1;
            if(isNaN(targetAmount)) targetAmount = 1;
            var currentDir, targetDir;
            // 겹치는 부분 삭제
            if(intersection.w < intersection.h) {
              // 가로 이동
              currentDir = currentPos.x > targetPos.x ? 1 : -1;
              targetDir = -currentDir;
              currentPos.x += currentDir * currentAmount * intersection.w;
              targetPos.x += targetDir * targetAmount * intersection.w;
              energyDirX = 1;
            } else {
              // 세로 이동
              currentDir = currentPos.y > targetPos.y ? 1 : -1;
              targetDir = -currentDir;
              currentPos.y += currentDir * currentAmount * intersection.h;
              targetPos.y += targetDir * targetAmount * intersection.h;
              energyDirY = 1;
            }
            // 운동량 계산
            var restitution = currentPhy.restitution * targetPhy.restitution;
            var friction = currentPhy.friction * targetPhy.friction;
            var energyX = 0, energyY = 0;
            if(currentVel != null) {
              if(energyDirY == 1 && targetDir == 1 && (targetVel == null || targetVel.onGround < 2)) {
                currentVel.onGround = 0;
              }
              energyX += currentVel.x * currentVel.x * currentPhy.mass;
              energyY += currentVel.y * currentVel.y * currentPhy.mass;
            }
            if(targetVel != null) {
              if(energyDirY == 1 && currentDir == 1 && (currentVel == null || currentVel.onGround < 2)) {
                targetVel.onGround = 0;
              }
              energyX += targetVel.x * targetVel.x * targetPhy.mass;
              energyY += targetVel.y * targetVel.y * targetPhy.mass;
            }
            if(currentVel != null) {
              currentVel.x += (Math.sqrt(energyX * currentAmount) / currentPhy.mass * currentDir * restitution - currentVel.x) * energyDirX;
              currentVel.y += (Math.sqrt(energyY * currentAmount)  / currentPhy.mass * currentDir * restitution - currentVel.y) * energyDirY;
              currentVel.x += (currentVel.x * (-friction)) * (1-energyDirX);
              currentVel.y += (currentVel.y * (-friction)) * (1-energyDirX);
              // 중력으로 인한 떨림 소거
              if(energyDirY == 1 && currentVel.y > -0.1 && currentVel.y < 0) currentVel.y = 0;
            }
            if(targetVel != null) {
              targetVel.x += (Math.sqrt(energyX * targetAmount)  / targetPhy.mass * targetDir * restitution - targetVel.x) * energyDirX;
              targetVel.y += (Math.sqrt(energyY * targetAmount) / targetPhy.mass * targetDir * restitution - targetVel.y) * energyDirY;
              targetVel.x += (targetVel.x * (-friction)) * (1-energyDirX);
              targetVel.y += (targetVel.y * (-friction)) * (1-energyDirY);
              // 중력으로 인한 떨림 소거
              if(energyDirY == 1 && targetVel.y > -0.1 && targetVel.y < 0) targetVel.y = 0;
            }
          }
        }
      }
    },
    priority: 500
  });
  animationLoop();  
}

function animationLoop() {
  window.requestAnimationFrame(animationLoop);
  engine.update();
}
