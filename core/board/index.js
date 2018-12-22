'use strict';

const _ = require('underscore'),
  BaseObject = require('../base-object'),
  cheerio = require('cheerio'),
  fs = require('fs'),
  Hex = require('./hex'),
  Junc = require('./junc'),
  Port = require('./port'),
  Road = require('./road'),
  scenarios = require('../scenarios'),
  utils = require('../utils');

const bootstrapSVG = fs.readFileSync(__dirname + '/bootstrap.svg');

function getOffsets(parity, factor=1) {

  const offsetsByClockPosition = {
    1:  { x:  1, y:  0, z: -1 },
    2:  { x:  2, y: -1, z: -1 },
    3:  { x:  1, y: -1, z:  0 },
    4:  { x:  1, y: -2, z:  1 },
    5:  { x:  0, y: -1, z:  1 },
    6:  { x: -1, y: -1, z:  2 },
    7:  { x: -1, y:  0, z:  1 },
    8:  { x: -2, y:  1, z:  1 },
    9:  { x: -1, y:  1, z:  0 },
    10: { x: -1, y:  2, z: -1 },
    11: { x:  0, y:  1, z: -1 },
    12: { x:  1, y:  1, z: -2 },
  };

  let offsets = {};
  for (let i=1; i<=12; i++) {
    if ((i % 2) == (parity === 'odd')) {
      offsets[i] = {
        x: offsetsByClockPosition[i].x * factor,
        y: offsetsByClockPosition[i].y * factor,
        z: offsetsByClockPosition[i].z * factor,
      };
    }
  }

  return offsets;
}

class CoordinateCache extends BaseObject {
  constructor() {

    super('CoordinateCache');
    this._items = {};

  }

  hash(prefix, coords) {
    const x = utils.round(coords.x, 2),
      y = utils.round(coords.y, 2),
      z = utils.round(coords.z, 2);

    return `${prefix}_${x}_${y}_${z}`;
  }

  get(prefix, coords) {
    const key = this.hash(prefix, coords);
    return this._items[key] || null;
  }

  set(prefix, coords, value) {
    const key = this.hash(prefix, coords);
    this._items[key] = value;
  }
}

class Board extends BaseObject {
  constructor(scenarioName) {

    super('Board');
    this.scenario = scenarios[scenarioName];
    this.buildStructure();
    this.svg = this.toSVG();

  }

  getOrCreate(name, Constructor, coords) {

    const prefix = name.substring(0, 1),
      items = this[name + 's'],
      num = this.counters[name];

    let item = this.cache.get(prefix, coords);
    if (!item) {

      item = new Constructor(num, coords);
      items[num] = item;
      this.cache.set(prefix, coords, item);

      ++this.counters[name];
    }

    return item;
  }

  buildStructure() {

    this.cache = new CoordinateCache();
    this.hexes = {};
    this.juncs = {};
    this.ports = {};
    this.roads = {};

    this.counters = {
      hex: 0,
      junc: 0,
      port: 0,
      road: 0,
    };

    // populate hexes
    this.scenario.topology.forEach(hexParams => {

      hexParams.resources = hexParams.resources ?
        hexParams.resources === '*'
          ? _.filter(Object.keys(this.scenario.resources), res => res !== 'ocean' )
          : hexParams.resources
        : [];

      const num = this.counters.hex,
        hex = new Hex(num, hexParams);

      this.hexes[num] = hex;
      this.cache.set('h', hexParams.coords, hex);
      ++this.counters.hex;
    });

    // populate ports
    this.scenario.ports.forEach(portParams => {

      const num = this.counters.port;
      this.ports[num] = new Port(num, portParams);
      ++this.counters.port;

    });

    // connect hexes to neighbors, juncs, and roads
    _.each(this.hexes, hex => {

      _.each(getOffsets('odd', 1), (offset, clockPos) => {
        hex.neighbors[clockPos] = this.cache.get('h', hex.offset(offset));
      });

      _.each(getOffsets('even', 1/3), (offset, clockPos) => {
        hex.juncs[clockPos] = this.getOrCreate('junc', Junc, hex.offset(offset));
      });

      _.each(getOffsets('odd', 1/2), (offset, clockPos) => {
        hex.roads[clockPos] = this.getOrCreate('road', Road, hex.offset(offset));
      });
    });

    // connect juncs to neighbors, hexes, and roads
    _.each(this.juncs, junc => {

      _.each(getOffsets('even', 1/3), (offset, clockPos) => {
        junc.neighbors[clockPos] = this.cache.get('j', junc.offset(offset));
        junc.hexes[clockPos] = this.cache.get('h', junc.offset(offset));
      });

      _.each(getOffsets('even', 1/6), (offset, clockPos) => {
        junc.roads[clockPos] = this.cache.get('r', junc.offset(offset));
      });
    });

    // set port coords and connect port to underlying road
    _.each(this.ports, port => {
      port.bind(this.cache);
    });

    // connect roads to neighbors, hexes, and juncs
    _.each(this.roads, road => {

      _.each(getOffsets('odd', 1/2), (offset, clockPos) => {
        road.neighbors[clockPos] = this.cache.get('r', road.offset(offset));
        road.hexes[clockPos] = this.cache.get('h', road.offset(offset));
      });

      _.each(getOffsets('even', 1/6), (offset, clockPos) => {
        road.juncs[clockPos] = this.cache.get('j', road.offset(offset));
      });
    });

    delete this.counters;
  }

  toSVG() {

    const $ = cheerio.load(bootstrapSVG),
      TILE_CHIP_RADIUS = 0.55,
      TILE_TEXT_OFFSET_Y = "-0.13em",
      TILE_CHIP_DOTS_OFFSET_Y = 0.35,
      TILE_CHIP_DOTS_OFFSET_X = 0.075,
      TILE_CHIP_DOTS_RADIUS = 0.05;

    $('svg')
      .attr('viewBox', '-2 -1.5 15 12')

    _.each(this.hexes, hex => {
      $('svg').append((() => {

        const rendered = hex.render();
        const $ = cheerio.load(`<g class="tile-group clickable"> type="title" id="tile_${hex.id}" num="${hex.id}">`);

        $('.tile-group')
          .append(`<polygon points="${rendered.points}" style="fill:#2d2;">`)
          .append('<g class="tile-chip">')
          .append('<title>');

        $('.tile-chip')
          .append(`<circle class="tile-chip-circle" cx="${rendered.cx}" cy="${rendered.cy}" r="${TILE_CHIP_RADIUS}" style="fill:#ccc;">`)
          .append(`<text x="${rendered.cx}" y="${rendered.cy}" dy="${TILE_TEXT_OFFSET_Y}">`)
          .append('<g class="tile-chip-dots">')

        $('.tile-chip text').css('font-size', '0.1em').css('color', 'aqua').text(rendered.roll);

        $('.tile-chip-dots')
          .append(`<circle class="tile-chip-dot chip-dot-6 chip-dot-8" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*-4}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-5 chip-dot-9" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*-3}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-6 chip-dot-8 chip-dot-4 chip-dot-10" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*-2}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-5 chip-dot-9 chip-dot-3 chip-dot-11" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*-1}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-6 chip-dot-8 chip-dot-4 chip-dot-10 chip-dot-2 chip-dot-12" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*0}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-5 chip-dot-9 chip-dot-3 chip-dot-11" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*1}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-6 chip-dot-8 chip-dot-4 chip-dot-10" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*2}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-5 chip-dot-9" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*3}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`)
          .append(`<circle class="tile-chip-dot chip-dot-6 chip-dot-8" cx="${rendered.cx + TILE_CHIP_DOTS_OFFSET_X*4}" cy="${rendered.cy + TILE_CHIP_DOTS_OFFSET_Y}" r="${TILE_CHIP_DOTS_RADIUS}">`);

        return $('.tile-group');

      })());
    });

    _.each(this.ports, port => {

    });

    _.each(this.roads, road => {
      $('svg').append((() => {

        const rendered = road.render();
        const $ = cheerio.load(`<g class="road-group clickable" type="road" id="num_${road.id}" num="${road.id}">`);

        $('.road-group')
          .append(`<path d="${rendered.path}" style="stroke-width:0.1; stroke:#555;">`)
          .append('<title>');

        return $('.road-group');

      })());
    });

    _.each(this.juncs, junc => {

      const rendered = junc.render();
      $('svg').append(`<circle cx="${rendered.cx}" cy="${rendered.cy}" r="0.2">`);

    });

    return $.html();
  }
}

module.exports = Board;
