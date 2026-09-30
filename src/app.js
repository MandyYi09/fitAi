import {prepareLandmarks,isSidePose,isUpperPose,requiredLandmarks} from './tracking-view.mjs';
import { PosePresence } from './pose-presence.mjs';
import { createFocusView } from './focus-view.mjs';
import { evaluate } from './pose-rules.mjs';
import { getReference, landmarkIds } from './reference.mjs';
import { comparePose, projectReference, normalizedLive } from './comparison.mjs';
const $ = id => document.getElementById(id);
import { poses } from './exercises.mjs';
import { categoryLabels, practiceModes, sequenceFor } from './practice-modes.mjs';
const selectedPose = () => poses.find(p => p.id === current);
const framing = id => isUpperPose(id) ? 'Face the camera with shoulders, elbows, wrists and hips visible. Feet can stay out of frame.' : isSidePose(id) ? 'Turn side-on with your whole body visible.' : 'Face the camera with your whole body visible.';
const presence = new PosePresence();
const focusView = createFocusView($('stage'),()=>{presence.dismiss();focusView.setExpanded(false);});
let lastPoseFrame=0;
let flipped = false;
let current = 'reach', filter = 'all', stream = null, landmarker = null, starting = false, runId = 0, lastVideo = -1, lastDetect = 0, lastFeedback = 0, remaining = 30, timerId = null, sceneApi = null;
function drawCards() {
 const shown=poses.filter(p => filter === 'all' || p.type === filter);
 $('movement-count').textContent=`${shown.length} movements`;
 $('category-intro').hidden=!practiceModes[filter];
 $('category-intro').textContent=practiceModes[filter]?.title || '';
 $('poses').innerHTML=shown.map(p => `<button class="pose-card ${p.id === current ? 'active' : ''}" data-pose="${p.id}" aria-pressed="${p.id === current}"><span class="pose-icon" aria-hidden="true">${p.icon}</span><span><strong>${p.name}</strong><small>${categoryLabels[p.type]} · ${p.demoOnly ? 'Demo' : (p.hold || 30)+' sec'}</small></span><span class="arrow">↗</span></button>`).join('');
 document.querySelectorAll('[data-pose]').forEach(b => b.onclick=() => selectPose(b.dataset.pose));
}
function selectPose(id, keepSide=false) {
 const p=poses.find(p=>p.id===id); if(!p)throw Error('Unknown movement');
 if(p.demoOnly && stream)stopCamera();
 current=id; if(!keepSide)flipped=false; stopTimer(); remaining=p.hold || 30; updateTimer();
 $('hold-duration').textContent=p.demoOnly ? 'Step by step' : remaining+' sec';
 $('duration-label').textContent=p.demoOnly ? 'At your own pace' : p.type==='gentle' ? 'Optional practice time' : 'Suggested hold';
 $('pose-tag').textContent=`${categoryLabels[p.type].toUpperCase()} · ${p.area}`;
 $('pose-name').textContent=p.name; $('pose-description').textContent=p.description;
 $('pose-level').textContent=p.level || 'Easy';
 $('angle-label').textContent=p.demoOnly ? '↔ Rotate to explore this step' : isUpperPose(id) ? '↔ Front camera · upper body' : isSidePose(id) ? '↔ Side-on camera · full body' : '↔ Face your camera';
 $('camera-setup').textContent=p.demoOnly ? 'Demonstration only · no camera or technique scoring.' : 'Camera setup: '+framing(id);
 $('stage-note').hidden=!!stream || !!practiceModes[p.type];
 $('stage-note').replaceChildren();
 $('stage-note').append(p.demoOnly ? 'Explore one step at a time.' : isUpperPose(id) ? 'Stay seated. Move at your own pace.' : 'A little space goes a long way.');
 const hint=document.createElement('small'); hint.textContent=p.demoOnly ? 'Select the numbered steps above the guide.' : framing(id); $('stage-note').append(hint);
 $('reference-label').textContent=p.demoOnly ? 'Illustrative 3D movement study' : isUpperPose(id) ? '3D reference · upper-body estimate' : '3D reference · 2D pose estimate';
 $('cues').innerHTML=p.cues.map((c,i)=>`<div class="cue"><span>${i+1}</span>${c}</div>`).join('');
 $('cue-heading').textContent=p.demoOnly ? 'Explore this step' : 'Move comfortably';
 const mode=practiceModes[p.type]; $('practice-note').hidden=!mode;
 $('practice-note-text').textContent=mode?.note || ''; $('practice-source').textContent=mode?.sourceLabel || ''; if(mode)$('practice-source').href=mode.source;
 const sequence=sequenceFor(id); $('sequence').hidden=!sequence.length;
 $('sequence-title').textContent=mode?.title || ''; $('sequence-count').textContent=sequence.length ? `${sequence.findIndex(x=>x.id===id)+1} / ${sequence.length}` : '';
 $('sequence-steps').replaceChildren();
 sequence.forEach((step,i)=>{const b=document.createElement('button'); b.textContent=`${i+1}. ${step.name}`;b.setAttribute('aria-pressed',String(step.id===id));b.onclick=()=>{selectPose(step.id,true);$('sequence-steps').children[i].focus({preventScroll:true});};$('sequence-steps').append(b);});
 $('timer-panel').hidden=$('timer-note').hidden=!!p.demoOnly;
 $('timer-label').textContent=p.type==='gentle' ? 'MOVE AT YOUR PACE' : 'COMFORTABLE HOLD';
 $('timer-note').textContent=p.type==='gentle' ? 'An optional timer. Move slowly and rest whenever you need to.' : 'A manual timer. Release sooner if you need to.';
 $('camera').disabled=!!p.demoOnly || starting; $('camera').textContent=p.demoOnly ? 'Demo only' : stream ? 'Stop camera' : '▣ Enable camera';
 $('camera-title').textContent=p.demoOnly ? 'Learn the sequence.' : 'Your space. Your pace.';
 $('camera-sub').textContent=p.demoOnly ? 'Step through the guide above. Camera scoring is not available for this sequence.' : stream ? framing(id) : 'Enable your camera for an approximate body-shape comparison.';
 $('show-camera').hidden=document.querySelector('.comparison-panel').hidden=!!p.demoOnly;
 drawCards();sceneApi?.setPose(id); $('switch-side').hidden=!(p.asymmetric || ['side','warrior'].includes(id));
 clearComparison();
 setFeedback({state:'unknown',title:p.demoOnly ? 'Movement study' : stream ? 'Find your starting position' : 'Ready when you are',text:p.demoOnly ? 'Use the numbered steps to inspect each position. These illustrative shapes have not been validated by a coach.' : stream ? framing(id) : 'You can follow the guide without a camera, or enable it for body-shape feedback.'});
}
function setFeedback(r) { $('focus-feedback').textContent=r.title+' — '+r.text; document.querySelector('.feedback').className = `feedback ${r.state}`; $('feedback-title').textContent = r.title; $('feedback-text').textContent = r.text; $('feedback-icon').textContent = r.state === 'good' ? '✓' : r.state === 'warning' ? '↗' : '◌'; }
document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('selected', x === b)); if(filter!=='all' && selectedPose().type!==filter)selectPose(poses.find(p=>p.type===filter).id);else drawCards(); });
$('help').onclick = () => $('help-dialog').showModal(); $('close-help').onclick = $('got-it').onclick = () => $('help-dialog').close();
function updateTimer() { $('time').textContent = `00:${String(remaining).padStart(2, '0')}`; }
function stopTimer() { clearInterval(timerId); timerId = null; $('timer').textContent = '▶'; $('timer').setAttribute('aria-label', 'Start hold timer'); }
$('timer').onclick = () => { if (timerId) { stopTimer(); return } if (!remaining) remaining = poses.find(p=>p.id===current)?.hold || 30; $('timer').textContent = 'Ⅱ'; $('timer').setAttribute('aria-label', 'Pause hold timer'); timerId = setInterval(() => { remaining--; updateTimer(); if (!remaining) { stopTimer(); setFeedback({ state: 'unknown', title: 'Take a breath', text: 'Release gently. Rest or switch sides when you’re ready.' }) } }, 1000); };
function stopCamera() { presence.reset();focusView.setExpanded(false);runId++; stream?.getTracks().forEach(t => t.stop()); stream = null; $('video').srcObject = null; $('video').hidden = $('overlay').hidden = true; $('three').hidden = false; $('stage-note').hidden = !!practiceModes[selectedPose().type]; $('rotate').hidden = false; $('stage').classList.remove('live'); $('show-camera').disabled=true; $('camera-dialog').close(); clearComparison(); $('mode').textContent = '○   REFERENCE PREVIEW'; $('camera').textContent = '▣   Enable camera'; $('camera-title').textContent = 'Your space. Your pace.'; $('camera-sub').textContent = 'Enable your camera to get live alignment cues.'; stopTimer(); setFeedback({ state: 'unknown', title: 'Camera is off', text: 'Your reference guide is ready. You can restart whenever you like.' }); }
$('camera').onclick = async () => {
    if (selectedPose().demoOnly)return; if (stream) { stopCamera(); return } if (starting) return; starting = true; $('camera').disabled = true; $('camera').textContent = 'Connecting…'; try {
        if (!navigator.mediaDevices?.getUserMedia) throw Error('Camera access requires HTTPS or localhost in a supported browser.'); stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false }); $('camera-sub').textContent = 'Preparing on-device pose tracking…'; if (!landmarker) { const { FilesetResolver, PoseLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs'); const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'); landmarker = await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: .6, minPosePresenceConfidence: .6, minTrackingConfidence: .6 }); }
        if(!stream || selectedPose().demoOnly){stopCamera();selectPose(current);return;}
        $('video').srcObject = stream; await $('video').play(); if(!stream || selectedPose().demoOnly){stopCamera();selectPose(current);return;} $('video').hidden = $('overlay').hidden = false; $('three').hidden = false; $('stage-note').hidden = true; $('rotate').hidden = false; $('stage').classList.add('live'); $('show-camera').disabled=false; $('mode').textContent = '●   LIVE · ON DEVICE'; $('camera').textContent = 'Stop camera'; $('camera-title').textContent = 'Make yourself comfortable.'; $('camera-sub').textContent = framing(current); lastVideo = -1; const token = ++runId; stream.getVideoTracks()[0].onended = () => { if (stream) stopCamera() }; requestAnimationFrame(t => track(t, token));
    } catch (e) { stopCamera(); if(selectedPose().demoOnly){selectPose(current);return;} const msg = e.name === 'NotAllowedError' ? 'Camera permission was declined. Allow access in your browser and try again.' : e.name === 'NotFoundError' ? 'No camera was found. Connect a camera and try again.' : e.message || 'Could not start tracking. Check your connection and try again.'; $('camera-sub').textContent = msg; setFeedback({ state: 'warning', title: 'Camera could not start', text: msg }); } finally { starting = false; $('camera').disabled = !!selectedPose().demoOnly; }
};
const connections = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
function track(t, token) {
    if (token !== runId || !stream) return; try {
        const v = $('video'); if (v.readyState >= 2 && v.currentTime !== lastVideo && t - lastDetect > 85) {
            lastVideo = v.currentTime; lastDetect = t; const result = landmarker.detectForVideo(v, t); const c = $('overlay'); c.width = v.videoWidth; c.height = v.videoHeight; const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); const p = prepareLandmarks(current,result.landmarks[0]);
            const assessment = evaluate(current, p, v.videoWidth, v.videoHeight);
            lastPoseFrame=t;
            const comparison = assessment.state === 'unknown' ? null : comparePose(current, p, c.width, c.height, flipped);
            focusView.setExpanded(presence.update(!!comparison && !!sceneApi,t));
            drawComparison(ctx, p, comparison, c.width, c.height);
            sceneApi?.setLive(comparison ? normalizedLive(current,p,c.width,c.height,flipped) : null,comparison?.adjustJoints || []);
            if (t - lastFeedback > 650) {
                lastFeedback = t;
                renderComparison(comparison);
                setFeedback(assessment.state === 'unknown' ? assessment : comparison?.feedback || {state:'unknown',title:'Adjust your camera view',text:'Some joints overlap. Move the camera slightly so each limb is visible.'});
            }
        } requestAnimationFrame(t => track(t, token));
    } catch (e) { stopCamera(); setFeedback({ state: 'warning', title: 'Tracking paused', text: 'Pose tracking encountered a problem. Restart the camera to try again.' }); }
}

function clearComparison() {
 const canvas=$('overlay'); canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
 renderComparison(null); sceneApi?.setLive(null); lastFeedback=0;
}
function renderComparison(result) {
 $('stage').dataset.match=result?.quality?.band || 'neutral';
 $('match-status').textContent=selectedPose().demoOnly ? 'Demonstration · no score' : result?.quality?.label || 'Waiting for a clear pose';
 $('comparison-status').textContent=result ? 'Your angles / reference angles' : isUpperPose(current) ? 'Upper-body tracking needed to compare' : 'Full-body tracking needed to compare';
 $('comparison-metrics').replaceChildren();
 for(const row of result?.metrics || []) {
  const el=document.createElement('div');el.className='metric '+(row.close?'close-match':'adjust');
  const label=document.createElement('span');label.textContent=row.label;
  const value=document.createElement('strong');value.textContent=`${Math.round(row.actual)}° / ${Math.round(row.target)}° ${row.close?'✓':'↗'}`;
  el.append(label,value);$('comparison-metrics').append(el);
 }
}
$('focus-camera').onclick=()=>$('camera-dialog').showModal();
$('focus-stop').onclick=()=>stopCamera();
setInterval(()=>{if(stream && performance.now()-lastPoseFrame>500){focusView.setExpanded(presence.update(false,performance.now()));sceneApi?.setLive(null);renderComparison(null);}},250);
$('show-camera').onclick=()=>$('camera-dialog').showModal();
$('close-camera').onclick=()=>$('camera-dialog').close();
$('switch-side').onclick=()=>{flipped=!flipped;sceneApi?.setPose(current);clearComparison();};
function drawComparison(ctx, p, result, width, height) {
 if(!p)return;
 const ghost=result ? projectReference(current,p,width,height,flipped) : null;
 const line=(a,b,color,dashed=false)=>{ctx.strokeStyle=color;ctx.lineWidth=5;ctx.setLineDash(dashed?[12,9]:[]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
 const allowed=requiredLandmarks(current,p);
 if(ghost)for(const[a,b]of connections)if(allowed.includes(a)&&allowed.includes(b))line(ghost[a],ghost[b],'#9ed4ff',true);
 for(const[a,b]of connections){if((p[a]?.visibility??0)<.65||(p[b]?.visibility??0)<.65)continue;const highlight=result?.adjustJoints.includes(a)||result?.adjustJoints.includes(b);line({x:p[a].x*width,y:p[a].y*height},{x:p[b].x*width,y:p[b].y*height},highlight?'#ffbe70':'#d9f6a0');}
 ctx.setLineDash([]);ctx.fillStyle='#f7ffe9';for(const i of landmarkIds){if((p[i]?.visibility??0)<.65)continue;ctx.beginPath();ctx.arc(p[i].x*width,p[i].y*height,5,0,Math.PI*2);ctx.fill();}
}

document.addEventListener('visibilitychange', () => { if (document.hidden) { stopTimer(); } }); window.addEventListener('pagehide', stopCamera);
selectPose('reach');
async function initThree() {
    try {
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'); const host = $('three'); const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(34, 1, .1, 100); camera.position.set(0, 1.65, 6.8); camera.lookAt(0, 1.15, 0); const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; host.append(renderer.domElement); scene.add(new THREE.HemisphereLight(0xffffff, 0x6f7d59, 2.5)); const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-3, 5, 4); scene.add(light); const group = new THREE.Group(); scene.add(group); const mat = new THREE.MeshStandardMaterial({ color: 0x6c8058, roughness: .65, metalness: .05 }); const jointmat = new THREE.MeshStandardMaterial({ color: 0xd8ecad, roughness: .55 }); const headmat = new THREE.MeshStandardMaterial({ color: 0x869974, roughness: .55 }); const floor = new THREE.Mesh(new THREE.CircleGeometry(1.4, 80), new THREE.MeshBasicMaterial({ color: 0xafbda1, transparent: true, opacity: .28 })); floor.rotation.x = -Math.PI / 2; floor.position.y = .02; scene.add(floor); const rings = new THREE.Mesh(new THREE.RingGeometry(1.18, 1.19, 100), new THREE.MeshBasicMaterial({ color: 0x96aa81, side: THREE.DoubleSide, transparent: true, opacity: .5 })); rings.rotation.x = -Math.PI / 2; rings.position.y = .03; scene.add(rings);
        const links = [[0, 1], [0, 2], [2, 4], [1, 3], [3, 5], [0, 6], [1, 7], [6, 7], [6, 8], [8, 10], [7, 9], [9, 11]]; let target = getReference(current, flipped), coords = target.map(p => new THREE.Vector3(...p)); const joints = coords.map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.075, 20, 16), jointmat); group.add(m); return m }); const bones = links.map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.058, .067, 1, 16), mat); group.add(m); return m }); const head = new THREE.Mesh(new THREE.SphereGeometry(.145, 32, 24), headmat); head.scale.y = 1.18; group.add(head); const neck = new THREE.Mesh(new THREE.CylinderGeometry(.055, .07, .18, 16), mat); group.add(neck); const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat); torso.scale.set(.22, .35, .12); group.add(torso); const liveGroup=new THREE.Group();group.add(liveGroup);liveGroup.visible=false;
        const liveBones=links.map(()=>{const material=new THREE.MeshBasicMaterial({color:0x243950,depthTest:false});const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,1,10),material);mesh.renderOrder=3;liveGroup.add(mesh);return mesh;});
        const liveJoints=landmarkIds.map(()=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(.038,12,10),new THREE.MeshBasicMaterial({color:0x243950,depthTest:false}));mesh.renderOrder=4;liveGroup.add(mesh);return mesh;});
        const propMaterial=new THREE.MeshStandardMaterial({color:0x9c8060,roughness:.8});
        const chairGroup=new THREE.Group();group.add(chairGroup);
        const seat=new THREE.Mesh(new THREE.BoxGeometry(.67,.07,.62),propMaterial);seat.position.set(0,.64,.08);chairGroup.add(seat);
        const back=new THREE.Mesh(new THREE.BoxGeometry(.67,.49,.055),propMaterial);back.position.set(0,1.03,-.23);chairGroup.add(back);
        for(const x of [-.27,.27])for(const z of [-.18,.32]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.59,10),propMaterial);leg.position.set(x,.32,z);chairGroup.add(leg);}
        const handle=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.52,12),propMaterial);handle.rotation.x=Math.PI/2;group.add(handle);
        const racket=new THREE.Group();group.add(racket);
        const grip=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.28,12),propMaterial);grip.position.y=.14;racket.add(grip);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(.18,.014,8,36),mat);rim.scale.y=1.3;rim.position.y=.5;racket.add(rim);
        const strings=new THREE.Mesh(new THREE.CircleGeometry(.165,24),new THREE.MeshBasicMaterial({color:0x7c8e70,transparent:true,opacity:.22,side:THREE.DoubleSide}));strings.scale.y=1.3;strings.position.y=.5;racket.add(strings);
        function updateProps(){
            const type=selectedPose().type;chairGroup.visible=type==='gentle';handle.visible=type==='rowing';racket.visible=type==='tennis';
            handle.position.copy(coords[4]).add(coords[5]).multiplyScalar(.5);
            const wrist=flipped?4:5,elbow=flipped?2:3;
            racket.position.copy(coords[wrist]);racket.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),coords[wrist].clone().sub(coords[elbow]).normalize());
        }
        const savedViews=new Map();
        let rotation=0;
        function chooseView(view){savedViews.set(current,view);const native=isSidePose(current)?'side':'front';rotation=view===native?0:Math.PI/2;document.querySelectorAll('[data-model-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modelView===view)));}
        document.querySelectorAll('[data-model-view]').forEach(b=>b.onclick=()=>chooseView(b.dataset.modelView));
        $('rotate').onclick=()=>{rotation+=Math.PI/4;document.querySelectorAll('[data-model-view]').forEach(b=>b.setAttribute('aria-pressed','false'));};
        chooseView(isSidePose(current)?'side':'front');
        sceneApi = { setPose(id) { target = getReference(id, flipped);chooseView(savedViews.get(id)||(isSidePose(id)?'side':'front')); }, setLive(values,adjust=[]) {
            liveGroup.visible=!!values;mat.color.set(values?0xdde5d6:0x6c8058);jointmat.color.set(values?0xf0f4e9:0xd8ecad);headmat.color.set(values?0xe5ebdf:0x869974);if(!values)return;
            const pts=values.map(v=>v?new THREE.Vector3(...v):null);liveJoints.forEach((m,i)=>{m.visible=!!pts[i];if(pts[i])m.position.copy(pts[i]);});
            links.forEach(([a,b],i)=>{const m=liveBones[i];m.visible=!!pts[a]&&!!pts[b];if(!m.visible)return;const d=pts[b].clone().sub(pts[a]);m.position.copy(pts[a]).add(pts[b]).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.material.color.set(adjust.includes(landmarkIds[a])||adjust.includes(landmarkIds[b])?0x854316:0x243950);});
        } }; new ResizeObserver(() => { const { width, height } = host.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width / height; camera.position.z = Math.max(6.8, 4.6 / camera.aspect); camera.updateProjectionMatrix(); }).observe(host);
        renderer.setAnimationLoop(() => { if (document.hidden || host.hidden) return; coords.forEach((v, i) => { v.lerp(new THREE.Vector3(...target[i]), .08); joints[i].position.copy(v) }); links.forEach(([a, b], i) => { const d = new THREE.Vector3().subVectors(coords[b], coords[a]); bones[i].position.copy(coords[a]).add(coords[b]).multiplyScalar(.5); bones[i].scale.y = d.length(); bones[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()) }); const shoulder = coords[0].clone().add(coords[1]).multiplyScalar(.5); const hip=coords[6].clone().add(coords[7]).multiplyScalar(.5);const axis=shoulder.clone().sub(hip).normalize();head.position.copy(shoulder).addScaledVector(axis,.31);neck.position.copy(shoulder).addScaledVector(axis,.12);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis);neck.quaternion.copy(head.quaternion); torso.position.copy(shoulder).add(coords[6].clone().add(coords[7]).multiplyScalar(.5)).multiplyScalar(.5); torso.rotation.z = -Math.atan2((coords[0].x+coords[1].x-coords[6].x-coords[7].x)/2,(coords[0].y+coords[1].y-coords[6].y-coords[7].y)/2); group.rotation.y += (rotation - group.rotation.y) * .06;updateProps();
            const boundPoints=[...coords,head.position.clone().add(new THREE.Vector3(0,.2,0))];
            if(racket.visible)boundPoints.push(new THREE.Vector3(0,.75,0).applyQuaternion(racket.quaternion).add(racket.position));
            const minY=Math.min(...boundPoints.map(v=>v.y))-.12,maxY=Math.max(...boundPoints.map(v=>v.y))+.12;
            const projected=boundPoints.map(v=>v.x*Math.cos(group.rotation.y)+v.z*Math.sin(group.rotation.y));
            const minX=Math.min(...projected)-.18,maxX=Math.max(...projected)+.18;
            const full=$('stage').classList.contains('focus-active');
            const area=host.getBoundingClientRect();
            const usableHeight=Math.max(.3,1-(full?230:190)/Math.max(area.height,1));
            const usableWidth=full?.88:.85;
            const distance=Math.max((maxY-minY)/(2*Math.tan(34*Math.PI/360)*usableHeight),(maxX-minX)/(2*Math.tan(34*Math.PI/360)*camera.aspect*usableWidth))+.12;
            const centerY=(minY+maxY)/2;
            camera.position.lerp(new THREE.Vector3((minX+maxX)/2,centerY,distance),.12);camera.lookAt(camera.position.x,centerY,0);
            renderer.render(scene, camera) });
    } catch (e) { $('stage-note').innerHTML = '3D guide could not load.<small>You can still follow the written cues or enable your camera.</small>'; $('rotate').disabled = true; }
}
initThree();
const lifecycle = new AbortController(); if (document.modelContext?.registerTool) { try { Promise.resolve(document.modelContext.registerTool({ name: 'select_stretch', description: 'Select a movement reference without activating the camera.', inputSchema: { type: 'object', properties: { id: { type: 'string', enum: poses.map(p => p.id) } }, required: ['id'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input) { if (!input || typeof input.id !== 'string' || !poses.some(p => p.id === input.id)) throw Error('Unknown movement'); selectPose(input.id); return { selected: current, cameraActive: !!stream } } }, { signal: lifecycle.signal })).catch(() => { }); } catch { } } window.addEventListener('pagehide', () => lifecycle.abort());
