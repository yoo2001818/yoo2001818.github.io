function EventEmitter() {
  this._listeners = {}, this._onces = {};
}

function BitSet(value) {
  this._words = new Uint32Array(value instanceof BitSet ? value._words : null != value ? value : INITAL_SIZE);
}

function Component() {}

function System() {}

function Entity(engine) {
  Package.EventEmitter.call(this), this.id = null, this._engine = engine, this.componentBits = new BitSet(), 
  this.componentGroupBits = new BitSet(), this.components = {}, this.componentsArray = [];
}

function ComponentGroup(contain, intersect, exclude) {
  Package.EventEmitter.call(this), this.id = null, this._engine = null, this.contain = contain, 
  this.intersect = intersect, this.exclude = exclude;
}

function Engine() {
  Package.EventEmitter.call(this), this._entities = {}, this._entitiesArray = [], 
  this._entityPos = 0, this._components = [], this._componentPos = 0, this._componentGroups = [], 
  this._componentGroupEntities = [], this.systems = [], this._systemTable = {}, this._systemPos = 0, 
  this._systemsSortRequired = !1;
}

"undefined" == typeof Package && (Package = {}), Package.components = {}, Package.actions = {}, 
Package.systems = {}, EventEmitter.prototype.on = function(event, listener) {
  null == this._listeners[event] && (this._listeners[event] = []), null == this._onces[event] && (this._onces[event] = []), 
  this._listeners[event].push(listener);
}, EventEmitter.prototype.once = function(event, listener) {
  this.on(event, listener), this._onces[event].push(listener);
}, EventEmitter.prototype.removeListener = function(event, listener) {
  if (null != this._listeners[event]) {
    var idx = this._listeners[event].indexOf(listener);
    if (-1 != idx && (this._listeners[event].splice(idx, 1), null != this._onces[event])) {
      var idx = this._onces[event].indexOf(listener);
      -1 != idx && this._onces[event].splice(idx, 1);
    }
  }
}, EventEmitter.prototype.removeAllListeners = function(event) {
  event ? (this._listeners[event] = [], this._onces[event] = []) : (this._listeners = {}, 
  this._onces = {});
}, EventEmitter.prototype.listeners = function(event) {
  var array = this._listeners[event];
  return array ? array : [];
}, EventEmitter.prototype.emit = function(event) {
  for (var args = [], i = 1; i < arguments.length; ++i) args.push(arguments[i]);
  var array = this._listeners[event], onceArray = this._onces[event];
  if (array) for (var i = 0; i < array.length; ++i) {
    var entry = array[i];
    entry.apply(this, args);
    var onceIdx = onceArray.indexOf(entry);
    -1 != onceIdx && (array.splice(i, 1), onceArray.splice(onceIdx, 1), i--);
  }
}, Package.EventEmitter = EventEmitter;

var INITAL_SIZE = 2, BITS_PER_WORD = 32, BITS_PER_BYTE = 8;

BitSet.prototype._reallocate = function(bitSize) {
  for (;this._words.length < (bitSize / BITS_PER_WORD | 0); ) {
    var newWords = new Uint32Array(2 * this._words.length);
    newWords.set(this._words), this._words = newWords;
  }
}, BitSet.prototype.size = function() {
  return this._words.byteLength * BITS_PER_BYTE;
}, BitSet.prototype.clear = function(pos) {
  this.set(pos, !1);
}, BitSet.prototype.clearRange = function(from, to) {
  this.setRange(from, to, !1);
}, BitSet.prototype.clearAll = function() {
  this.setAll(!1);
}, BitSet.prototype.set = function(pos, set) {
  pos |= 0, this._reallocate(pos);
  var wordPos = pos / BITS_PER_WORD | 0, shiftPos = pos % BITS_PER_WORD;
  set ? this._words[wordPos] |= 1 << shiftPos : this._words[wordPos] &= ~(1 << shiftPos);
}, BitSet.prototype.setRange = function(from, to, set) {
  for (var i = from; to >= i; ++i) this.set(i, set);
}, BitSet.prototype.setAll = function(set) {
  this.setRange(0, this.size() - 1, set);
}, BitSet.prototype.get = function(pos) {
  pos |= 0, this._reallocate(pos);
  var wordPos = pos / BITS_PER_WORD | 0, shiftPos = pos % BITS_PER_WORD;
  return (this._words[wordPos] & 1 << shiftPos) > 0;
}, BitSet.prototype.and = function(set) {
  if (null == set) return void this.clearAll();
  var intersectSize = 0 | Math.min(this._words.length, set._words.length), unionSize = 0 | Math.max(this._words.length, set._words.length);
  this._reallocate(unionSize * BITS_PER_WORD);
  for (var i = 0; unionSize > i; ++i) i > intersectSize ? this._words[i] = 0 : this._words[i] &= set._words[i];
}, BitSet.prototype.or = function(set) {
  if (null != set) {
    var intersectSize = 0 | Math.min(this._words.length, set._words.length), unionSize = 0 | Math.max(this._words.length, set._words.length);
    this._reallocate(unionSize * BITS_PER_WORD);
    for (var i = 0; unionSize > i; ++i) i > intersectSize ? this._words.length < set._words.length && (this._words[i] = set._words[i]) : this._words[i] |= set._words[i];
  }
}, BitSet.prototype.xor = function(set) {
  if (null != set) {
    var intersectSize = 0 | Math.min(this._words.length, set._words.length), unionSize = 0 | Math.max(this._words.length, set._words.length);
    this._reallocate(unionSize * BITS_PER_WORD);
    for (var i = 0; unionSize > i; ++i) i > intersectSize ? this._words.length < set._words.length && (this._words[i] = set._words[i]) : this._words[i] ^= set._words[i];
  }
}, BitSet.prototype.not = function() {
  for (var i = 0; i < this._words.length; ++i) this._words[i] = ~this._words[i];
}, BitSet.prototype.isEmpty = function() {
  for (var i = 0; i < this._words.length; ++i) if (this._words[i]) return !1;
  return !0;
}, BitSet.prototype.intersects = function(set) {
  if (null == set) return !1;
  for (var intersectSize = 0 | Math.min(this._words.length, set._words.length), i = 0; intersectSize > i; ++i) if (this._words[i] & set._words[i]) return !0;
  return !1;
}, BitSet.prototype.contains = function(set) {
  if (null == set) return !1;
  for (var intersectSize = 0 | Math.min(this._words.length, set._words.length), i = 0; intersectSize > i; ++i) if ((this._words[i] & set._words[i]) != set._words[i]) return !1;
  return !0;
}, BitSet.prototype.equals = function(set) {
  if (null == set || !(set instanceof BitSet)) return !1;
  for (var intersectSize = 0 | Math.min(this._words.length, set._words.length), unionSize = 0 | Math.max(this._words.length, set._words.length), i = 0; unionSize > i; ++i) if (i > intersectSize) {
    if (this._words.length < set._words.length) {
      if (set._words[i]) return !1;
    } else if (this._words[i]) return !1;
  } else if (this._words[i] ^ set._words[i]) return !1;
  return !0;
}, BitSet.prototype.toString = function(redix) {
  for (var map = [], i = 0; i < this._words.length; ++i) {
    var value = this._words[i];
    map.push(value.toString(redix || 2));
  }
  return map.reverse().join(" ");
}, Package.BitSet = BitSet, Component.create = function() {
  return new Component();
}, Package.Component = Component, System.prototype.onAddedToEngine = function() {}, 
System.prototype.onRemovedFromEngine = function() {}, System.prototype.update = function() {}, 
Package.System = System, Entity.prototype = Object.create(Package.EventEmitter.prototype), 
Entity.prototype.constructor = Entity, Entity.prototype.add = function(component) {
  var bitPos = this._engine.getComponentBit(component.constructor);
  this.componentBits.set(bitPos, !0), this.components[bitPos] = component, this.componentsArray.push(component), 
  this.emit("componentAdded", this, component);
}, Entity.prototype.remove = function(component) {
  var bitPos;
  bitPos = this._engine.getComponentBit("function" == typeof component ? component : component.constructor), 
  this.componentBits.set(bitPos, !1);
  var orig = this.components[bitPos];
  this.componentsArray.splice(this.componentsArray.indexOf(orig), 1), delete this.components[bitPos], 
  this.emit("componentRemoved", this, component);
}, Entity.prototype.removeAll = function() {
  for (;this.componentsArray.length > 0; ) this.remove(this.componentsArray[0]);
}, Entity.prototype.get = function(component) {
  var bitPos = this._engine.getComponentBit(component);
  return this.components[bitPos];
}, Entity.prototype.getComponents = function() {
  return this.componentsArray;
}, Entity.prototype.has = function(component) {
  var bitPos = this._engine.getComponentBit(component);
  return this.componentBits.get(bitPos);
}, Package.Entity = Entity, ComponentGroup.prototype = Object.create(Package.EventEmitter.prototype), 
ComponentGroup.prototype.constructor = ComponentGroup, ComponentGroup.prototype.matches = function(entity) {
  var compBits = entity.componentBits;
  return compBits.isEmpty() ? !1 : compBits.contains(this.contain) && (this.intersect.isEmpty() || this.intersect.intersects(compBits)) ? this.exclude.intersects(compBits) ? !1 : !0 : !1;
}, ComponentGroup.prototype.equals = function(o) {
  return this.contain.equals(o.contain) && this.intersect.equals(o.intersect) && this.exclude.equals(o.exclude) ? !0 : !1;
}, ComponentGroup.createBuilder = function(engine) {
  return new ComponentGroup.Builder(engine);
}, ComponentGroup.Builder = function(engine) {
  this._engine = engine, this._contain = new BitSet(), this._intersect = new BitSet(), 
  this._exclude = new BitSet();
}, ComponentGroup.Builder.prototype.reset = function() {
  return this._contain = new BitSet(), this._intersect = new BitSet(), this._exclude = new BitSet(), 
  this;
}, ComponentGroup.Builder.prototype.contain = function() {
  return this._contain.or(this._engine.getComponentsBitSet(arguments)), this;
}, ComponentGroup.Builder.prototype.intersect = function() {
  return this._intersect.or(this._engine.getComponentsBitSet(arguments)), this;
}, ComponentGroup.Builder.prototype.exclude = function() {
  return this._exclude.or(this._engine.getComponentsBitSet(arguments)), this;
}, ComponentGroup.Builder.prototype.build = function() {
  return new ComponentGroup(this._contain, this._intersect, this._exclude);
}, Package.ComponentGroup = ComponentGroup;

var DEFAULT_SYSTEM_PRIORITY = 1e3;

Engine.prototype = Object.create(Package.EventEmitter.prototype), Engine.prototype.constructor = Engine, 
Engine.prototype.registerComponent = function(component) {
  return -1 == this._components.indexOf(component) ? (component.bitIndex = this._componentPos, 
  this._components.push(component), this._componentPos++) : void 0;
}, Engine.prototype.getComponentBit = function(component) {
  var bitPos = this._components.indexOf(component);
  return -1 == bitPos ? this.registerComponent(component) : bitPos;
}, Engine.prototype.getComponentsBitSet = function(components) {
  for (var bits = new Package.BitSet(), i = 0; i < components.length; ++i) bits.set(this.getComponentBit(components[i]), !0);
  return bits;
}, Engine.prototype.obtainEntityId = function() {
  return this._entityPos++;
}, Engine.prototype.addEntity = function(entity) {
  null == entity.id && (entity.id = this.obtainEntityId(), entity._engine = this, 
  this._entities[entity.id] = entity, this._entitiesArray.push(entity), this.emit("entityAdded", entity), 
  this.updateComponentGroup(entity), entity.on("componentAdded", this.updateComponentGroup), 
  entity.on("componentRemoved", this.updateComponentGroup));
}, Engine.prototype.removeEntity = function(entity) {
  var entityPos = this._entitiesArray.indexOf(entity);
  if (-1 != entityPos) {
    delete this._entities[entity.id], this._entitiesArray.splice(entityPos, 1), this.emit("entityRemoved", entity), 
    entity.removeListener("componentAdded", this.updateComponentGroup), entity.removeListener("componentRemoved", this.updateComponentGroup);
    for (var i = 0; i < this._componentGroups.length; ++i) {
      var componentGroup = this._componentGroups[i];
      if (entity.componentGroupBits.get(componentGroup.id)) {
        var componentEntities = this._componentGroupEntities[i];
        componentEntities.splice(componentEntities.indexOf(entity), 1), componentGroup.emit("entityRemoved", entity);
      }
    }
  }
}, Engine.prototype.removeAllEntities = function() {
  for (;this._entitiesArray.length > 0; ) this.removeEntity(this._entitiesArray[0]);
}, Engine.prototype.getEntity = function(id) {
  return this._entities[id];
}, Engine.prototype.getEntities = function() {
  return this._entitiesArray;
}, Engine.prototype.updateComponentGroup = function(entity) {
  for (var i = 0; i < this._componentGroups.length; ++i) {
    var componentGroup = this._componentGroups[i];
    if (componentGroup.matches(entity)) entity.componentGroupBits.get(componentGroup.id) || (entity.componentGroupBits.set(componentGroup.id, !0), 
    this._componentGroupEntities[i].push(entity), componentGroup.emit("entityAdded", entity)); else if (entity.componentGroupBits.get(componentGroup.id)) {
      entity.componentGroupBits.set(componentGroup.id, !1);
      var componentEntities = this._componentGroupEntities[i];
      componentEntities.splice(componentEntities.indexOf(entity), 1), componentGroup.emit("entityRemoved", entity);
    }
  }
}, Engine.prototype.registerComponentGroup = function(componentGroup) {
  for (var i = 0; i < this._componentGroups.length; ++i) if (this._componentGroups[i].equals(componentGroup)) return this._componentGroupEntities[i];
  if (null != componentGroup.id && this._componentGroups[componentGroup.id] == componentGroup) return this._componentGroupEntities[componentGroup.id];
  componentGroup.id = this._componentGroups.length, componentGroup._engine = this, 
  this._componentGroups.push(componentGroup);
  var componentGroupEntity = [];
  return this._componentGroupEntities.push(componentGroupEntity), this.getEntities().forEach(function(entity) {
    componentGroup.matches(entity) && (entity.componentGroupBits.set(componentGroup.id, !0), 
    componentGroupEntity.push(entity), componentGroup.emit("entityAdded", entity));
  }), componentGroupEntity;
}, Engine.prototype.getEntitiesFor = function(componentGroup) {
  return this.registerComponentGroup(componentGroup);
}, Engine.prototype.getComponentGroup = function(entities) {
  return this._componentGroups[this._componentGroupEntities.indexOf(entities)];
}, Engine.prototype.addSystem = function(system) {
  -1 == this.systems.indexOf(system) && (this._systemTable[system.constructor] = system, 
  system._id = this._systemPos++, this.systems.push(system), "function" == typeof system.onAddedToEngine && system.onAddedToEngine(this), 
  null == system.priority && (system.priority = DEFAULT_SYSTEM_PRIORITY), system.engine = this, 
  this._systemsSortRequired = !0);
}, Engine.prototype.getSystem = function(system) {
  return this._systemTable[system];
}, Engine.prototype.removeSystem = function(system) {
  var systemPos = this.systems.indexOf(system);
  -1 != systemPos && (delete this._systemTable[system.constructor], this.systems.splice(systemPos, 1), 
  "function" == typeof system.onRemovedFromEngine && system.onRemovedFromEngine(this));
}, Engine.prototype.sortSystems = function() {
  this._systemsSortRequired && (this.systems.sort(function(a, b) {
    return a.priority > b.priority ? 1 : a.priority < b.priority ? -1 : a._id > b._id ? 1 : a._id < b._id ? -1 : 0;
  }), this._systemsSortRequired = !1);
}, Engine.prototype.update = function() {
  this.sortSystems(), this.systems.forEach(function(system) {
    system.update && system.update();
  });
}, Package.Engine = Engine;
