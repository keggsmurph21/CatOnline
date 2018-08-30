'use strict';

const _ = require('underscore'),
  expect = require('chai').expect,
  sinon = require('sinon'),
  catan = require('../core');

describe('utilities', () => {

  it('convert Cube => Cartesian coords', () => {
    function convert(coords) {
      return catan.utils.cubeToCartesian(coords);
    }

    function decode(coordStr) {
      const nums = coordStr.split('_').map(chars => parseFloat(chars));

      let coords = {
        x: nums[0],
        y: nums[1],
      };

      if (nums.length === 3)
        coords.z = nums[2];

      return coords;
    }

    _.each({
      '0_0_0': '0_0',
      '1_-1_0': '2_0',
      '2_-2_0': '4_0',
      '3_-3_0': '6_0',
      '4_-4_0': '8_0',
      '0_-1_1': '1_1',
      '1_-2_1': '3_1',
      '2_-3_1': '5_1',
      '3_-4_1': '7_1',
      '4_-5_1': '9_1',
      '-1_-1_2': '0_2',
      '0_-2_2': '2_2',
      '1_-3_2': '4_2',
      '2_-4_2': '6_2',
      '3_-5_2': '8_2',
      '4_-6_2': '10_2',
      '-2_-1_3': '-1_3',
      '-1_-2_3': '1_3',
      '0_-3_3': '3_3',
      '1_-4_3': '5_3',
      '2_-5_3': '7_3',
      '3_-6_3': '9_3',
      '4_-7_3': '11_3',
      '-2_-2_4': '0_4',
      '-1_-3_4': '2_4',
      '0_-4_4': '4_4',
      '1_-5_4': '6_4',
      '2_-6_4': '8_4',
      '3_-7_4': '10_4',
      '-2_-3_5': '1_5',
      '-1_-4_5': '3_5',
      '0_-5_5': '5_5',
      '1_-6_5': '7_5',
      '2_-7_5': '9_5',
      '-2_-4_6': '2_6',
      '-1_-5_6': '4_6',
      '0_-6_6': '6_6',
      '1_-7_6': '8_6',
    }, (cart, cube) => {

      cube = decode(cube);
      cart = decode(cart);

      expect(convert(cube)).to.deep.equal(cart);
    });

  });
});
