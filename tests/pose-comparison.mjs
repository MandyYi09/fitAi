import assert from 'node:assert/strict';
import {poses} from '../dist/exercises.mjs';
import {getReference,landmarkIds} from '../dist/reference.mjs';
import {comparePose,normalizedLive} from '../dist/comparison.mjs';
import {evaluate} from '../dist/pose-rules.mjs';
import {matchQuality} from '../dist/match-quality.mjs';
import {PosePresence} from '../dist/pose-presence.mjs';
assert.equal(poses.length,24);assert.equal(new Set(poses.map(p=>p.id)).size,24);
for(const pose of poses)for(const flipped of [false,true]){
 const ref=getReference(pose.id,flipped);assert.equal(ref.length,12);
 const p=Array.from({length:33},()=>({x:.5,y:.5,visibility:.99}));
 ref.forEach((v,i)=>p[landmarkIds[i]]={x:.5-v[0]*.18,y:.85-v[1]*.18,visibility:.99});
 const r=comparePose(pose.id,p,1000,1000,flipped);assert.ok(r,pose.id);assert.equal(r.quality.band,'green',pose.id);assert.ok(r.metrics.every(m=>m.delta<.001),pose.id);
 assert.notEqual(evaluate(pose.id,p).state,'unknown',pose.id);
 assert.ok(normalizedLive(pose.id,p,1000,1000).flat().every(Number.isFinite));
 const elbow=r.metrics.find(m=>m.label==='Left elbow');
 p[15]=elbow.actual>90?{...p[11]}:{x:2*p[13].x-p[11].x,y:2*p[13].y-p[11].y,visibility:.99};
 assert.notEqual(comparePose(pose.id,p,1000,1000,flipped)?.quality.band,'green',pose.id);
 p[15].visibility=.1;assert.equal(evaluate(pose.id,p).state,'unknown');
}
assert.equal(matchQuality([{delta:0,close:true}]).band,'green');assert.equal(matchQuality([{delta:25,close:false}]).band,'orange');assert.equal(matchQuality([{delta:80,close:false}]).band,'red');assert.equal(matchQuality([{delta:NaN,close:false}]),null);
const presence=new PosePresence();assert.equal(presence.update(true,0),false);assert.equal(presence.update(true,600),true);assert.equal(presence.update(false,700),true);assert.equal(presence.update(false,2200),false);presence.update(true,2300);assert.equal(presence.update(true,2900),true);presence.dismiss();assert.equal(presence.update(true,4000),false);
console.log('PASS: 24 unique movements, 48 mirrored references, confidence gating, changed-limb corrections, color states, and fullscreen acquisition/loss.');
