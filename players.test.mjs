import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.mjs';
test('three wait, fourth starts, fifth waits',()=>{const g=new Game();for(let i=0;i<3;i++)g.add('p'+i);assert.equal(g.phase,'waiting');g.add('p3');assert.equal(g.phase,'countdown');assert.equal(g.team.length,4);g.add('p4');assert.equal(g.view('p4').playing,false);assert.equal(g.view('p4').code,null);});
