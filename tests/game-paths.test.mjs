import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isGamePath, simulationUrl} from '../uni-app/src/data/game-matching.js';

test('all six project routes stay inside the game page allowlist',()=>{
 for(const game of ['miniapp','video','education-ppt','books','brain','trends']) assert.equal(isGamePath(simulationUrl(game)),true,game);
 assert.equal(isGamePath('/static/simulation-games/video.html?start=1&life=%E5%AD%A6%E7%94%9F'),true);
});

test('game route rejects unknown files, traversal, fragments and other hosts',()=>{
 for(const value of ['https://evil.example/static/simulation-games/video.html','//evil.example','/static/simulation-games/../video.html','/static/simulation-games/%2e%2e/video.html','/static/simulation-games/share-poster.js','/static/simulation-games/pick.html','/static/simulation-games/video.html#frag','']) assert.equal(isGamePath(value),false,value);
});
