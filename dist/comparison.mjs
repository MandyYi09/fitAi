import {getReference,landmarkIds} from './reference.mjs';
import {angle} from './pose-rules.mjs';
export function projectReference(id,p,width,height,flipped=false){
 const ref=getReference(id,flipped),hx=(p[23].x+p[24].x)*width/2,hy=(p[23].y+p[24].y)*height/2;
 const torso=Math.hypot((p[11].x+p[12].x)*width/2-hx,(p[11].y+p[12].y)*height/2-hy);
 const ry=(ref[6][1]+ref[7][1])/2,sy=(ref[0][1]+ref[1][1])/2,scale=torso/Math.hypot((ref[0][0]+ref[1][0]-ref[6][0]-ref[7][0])/2,sy-ry);
 return Object.fromEntries(landmarkIds.map((key,i)=>[key,{x:hx-ref[i][0]*scale,y:hy-(ref[i][1]-ry)*scale}]));
}
export function normalizedLive(id,p,width,height){
 const ref=getReference(id),hx=(p[23].x+p[24].x)*width/2,hy=(p[23].y+p[24].y)*height/2;
 const length=Math.hypot((p[11].x+p[12].x)*width/2-hx,(p[11].y+p[12].y)*height/2-hy);
 if(length<1)return null;const ry=(ref[6][1]+ref[7][1])/2,scale=Math.hypot((ref[0][0]+ref[1][0]-ref[6][0]-ref[7][0])/2,(ref[0][1]+ref[1][1])/2-ry)/length;
 return landmarkIds.map(i=>[-(p[i].x*width-hx)*scale,ry-(p[i].y*height-hy)*scale,.19]);
}
export function comparePose(id,p,width,height,flipped=false){
 const ref=projectReference(id,p,width,height,flipped),actual=p.map(v=>({x:v.x*width,y:v.y*height}));
 const defs=[['Left elbow',[11,13,15],'Gently lengthen your left arm','Soften your left elbow'],['Right elbow',[12,14,16],'Gently lengthen your right arm','Soften your right elbow']];
 defs.push(['Left arm lift',[23,11,13],'Raise your left arm a little','Lower your left arm a little'],['Right arm lift',[24,12,14],'Raise your right arm a little','Lower your right arm a little']);
 defs.push(['Left knee',[23,25,27],'Ease your left leg toward a longer position','Gently soften your left knee'],['Right knee',[24,26,28],'Ease your right leg toward a longer position','Gently soften your right knee']);
 const metrics=defs.map(([label,joints,up,down])=>{const a=angle(...joints.map(i=>actual[i])),t=angle(...joints.map(i=>ref[i]));return {label,joints,actual:a,target:t,delta:Math.abs(a-t),close:Math.abs(a-t)<=18,cue:(a<t?up:down)+', only within a comfortable range.'}});
 const hip={x:(actual[23].x+actual[24].x)/2,y:(actual[23].y+actual[24].y)/2},shoulder={x:(actual[11].x+actual[12].x)/2,y:(actual[11].y+actual[12].y)/2};
 const rh={x:(ref[23].x+ref[24].x)/2,y:(ref[23].y+ref[24].y)/2},rs={x:(ref[11].x+ref[12].x)/2,y:(ref[11].y+ref[12].y)/2};
 const lean=(h,s)=>Math.atan2(s.x-h.x,h.y-s.y)*180/Math.PI;const a=lean(hip,shoulder),t=lean(rh,rs);
 metrics.unshift({label:'Torso lean',joints:[11,12,23,24],actual:a,target:t,delta:Math.abs(a-t),close:Math.abs(a-t)<=12,cue:id==='side'?'Move your torso gently toward the blue reference, or switch the reference side.':'Bring your shoulders gently back over your hips.'});
 const failed=metrics.filter(m=>!m.close).sort((a,b)=>b.delta-a.delta);const worst=failed[0];
 return {metrics,adjustJoints:[...new Set(failed.flatMap(m=>m.joints))],feedback:worst?{state:'warning',title:worst.label+' · try a small adjustment',text:worst.cue}:{state:'good',title:'Your lines are close to the reference',text:'The visible angles are similar. Keep breathing; stop or ease out if anything hurts.'}};
}
