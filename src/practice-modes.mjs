export const categoryLabels = {
  stretch: 'Stretch', yoga: 'Yoga', rowing: 'Rowing', tennis: 'Tennis', gentle: 'Gentle movement',
};

export const practiceModes = {
  rowing: {
    title: 'Rowing · stroke walkthrough',
    note: 'An illustrative rowing / ergometer sequence. Step through slowly; transitions are simplified. Wrist angle, grip and blade depth are not measured. Review on-water technique with your coach.',
    source: 'https://www.concept2.co.uk/training/rowing-technique',
    sourceLabel: 'Technique background · Concept2',
  },
  tennis: {
    title: 'Tennis · forehand walkthrough',
    note: 'An illustrative forehand sequence for shadow practice. Use Switch side for the opposite hand. This guide does not assess ball contact, racket face, speed or technique quality.',
    source: 'https://www.usta.com/en/home/improve/tips-and-instruction/national/improve-your-tennis-game--get-your-forehand-flowing.html',
    sourceLabel: 'Forehand background · USTA',
  },
  gentle: {
    title: 'Gentle movement · seated upper body',
    note: 'A seated starting point for older adults. Use a stable chair without wheels and keep your feet supported. Choose a comfortable range; the camera compares upper-body shape only.',
    source: 'https://www.nhs.uk/live-well/exercise/sitting-exercises/',
    sourceLabel: 'Seated exercise guidance · NHS',
  },
};

const rowing = { type: 'rowing', area: 'STROKE STUDY', icon: '↔', cameraView: 'side', demoOnly: true, sequence: 'rowing', level: 'Slow study' };
const tennis = { type: 'tennis', area: 'SHADOW FOREHAND', icon: '◉', demoOnly: true, sequence: 'tennis', asymmetric: true, level: 'No ball needed' };
const gentle = { type: 'gentle', area: 'SEATED UPPER BODY', icon: '⌑', tracking: 'upper', sequence: 'gentle', level: 'Seated', hold: 10 };

export const practicePoses = [
  { ...rowing, id: 'rowing-catch', name: 'Catch', description: 'Explore the compact starting shape of a rowing stroke.', cues: ['View the model side-on; use an ergometer to practise the full leg motion.', 'Reach from your hips with arms long and shoulders relaxed.', 'Keep the forward reach comfortable; avoid compressing past your available range.'] },
  { ...rowing, id: 'rowing-drive', name: 'Drive', description: 'Study the leg-led part of the stroke before the arm pull.', cues: ['Begin by pressing through your legs on the ergometer.', 'Let your torso move toward upright as the legs extend.', 'Keep the arms long early in the drive; avoid lifting the shoulders to pull.'] },
  { ...rowing, id: 'rowing-finish', name: 'Finish', description: 'Notice the low hand position at the end of the pull.', cues: ['Finish with legs long and a small backward lean.', 'Draw the handle toward the lower ribs with relaxed shoulders.', 'Keep the grip light and wrists aligned with the forearms; the model cannot verify wrist technique.'] },
  { ...rowing, id: 'rowing-recovery', name: 'Recovery', description: 'Send the hands away before returning toward the catch.', cues: ['Let the arms lengthen before hinging forward at the hips.', 'After the hands pass the knees, allow the knees to bend.', 'Return smoothly and unhurriedly. Use your coach’s cues for on-water bladework.'] },
  { ...tennis, id: 'tennis-ready', name: 'Ready position', description: 'Start a slow forehand walkthrough from a balanced stance.', cues: ['Clear enough space for your arms; a racket is optional.', 'Stand comfortably with soft knees and hands in front.', 'Begin with a small, unforced shadow movement.'] },
  { ...tennis, id: 'tennis-turn', name: 'Unit turn', description: 'Turn the torso and hips together to prepare the forehand.', cues: ['Turn toward your racket side as one unit.', 'Let your free hand help guide the preparation.', 'Rotate the model to inspect the turn; avoid forcing your back or shoulder.'] },
  { ...tennis, id: 'tennis-forward', name: 'Forward swing', description: 'Explore the forward part of a slow shadow swing.', cues: ['Allow the body to turn back toward the imagined ball.', 'Move the hitting arm forward in a comfortable arc.', 'Keep this slow: the reference does not show exact contact or racket-face control.'] },
  { ...tennis, id: 'tennis-follow', name: 'Follow-through', description: 'Let the arm continue across the body, then reset.', cues: ['Allow the hitting arm to continue across the torso.', 'Finish in balance without forcing the arm around your neck.', 'Return to Ready position before another relaxed repetition.'] },
  { ...gentle, id: 'gentle-reset', name: 'Seated reset', description: 'Settle into your chair before moving your arms.', cues: ['Sit securely on a stable chair, with feet supported.', 'Rest your arms beside you and relax your shoulders.', 'Breathe normally. Stay in a position that feels comfortable.'] },
  { ...gentle, id: 'gentle-open', name: 'Easy chest opening', description: 'Open your arms a little below shoulder level.', cues: ['Keep your feet supported and sit comfortably upright.', 'Open your arms gently to the sides without pulling them back.', 'Use a small range; return to rest when you want to.'] },
  { ...gentle, id: 'gentle-bend', name: 'Gentle elbow bend', description: 'Bend and lower your forearms without weights.', cues: ['Let your upper arms stay near your sides.', 'Slowly bend your elbows, then lower your hands again.', 'Relax your shoulders and use a comfortable range.'] },
  { ...gentle, id: 'gentle-lift', name: 'Easy arm lift', description: 'Lift your arms partway to the sides, then lower them.', cues: ['Start with your arms resting by your sides.', 'Lift only as far as comfortable, keeping elbows soft.', 'Lower slowly. You do not need to reach the model’s height.'] },
];

// Authored illustrative keyframes, not motion-capture data or validated angle targets.
const sideFrame = points => points.flatMap(([x, y]) => [[x, y, -.16], [x, y, .16]]);
const seat = [[-.23,1.4,0],[.23,1.4,0],[-.31,1.01,0],[.31,1.01,0],[-.36,.64,0],[.36,.64,0],[-.16,.75,0],[.16,.75,0],[-.24,.68,.45],[.24,.68,.45],[-.24,.12,.45],[.24,.12,.45]];
const standing = [[-.23,1.63,0],[.23,1.63,0],[-.34,1.25,.12],[.34,1.25,.12],[-.12,1.37,.44],[.12,1.37,.44],[-.16,.98,0],[.16,.98,0],[-.3,.55,.09],[.3,.55,.09],[-.38,.12,0],[.38,.12,0]];
const frame = (base, changes) => base.map((p,i) => [...(changes[i] || p)]);
export const practiceReferences = {
  'rowing-catch': sideFrame([[-.22,1.32],[-.6,1.22],[-.98,1.12],[0,.71],[-.62,.65],[-.68,.12]]),
  'rowing-drive': sideFrame([[.12,1.38],[-.23,1.18],[-.59,.99],[.19,.72],[-.28,.43],[-.68,.12]]),
  'rowing-finish': sideFrame([[.46,1.37],[.61,1.01],[.23,.99],[.25,.75],[-.22,.43],[-.68,.12]]),
  'rowing-recovery': sideFrame([[.03,1.37],[-.33,1.19],[-.7,1.02],[.25,.75],[-.22,.43],[-.68,.12]]),
  'tennis-ready': frame(standing, {}),
  'tennis-turn': frame(standing, {0:[-.13,1.63,.2],1:[.13,1.63,-.2],2:[.2,1.4,.35],3:[.42,1.32,-.28],4:[.48,1.38,.12],5:[.55,1.45,-.55],6:[-.1,.98,.12],7:[.1,.98,-.12]}),
  'tennis-forward': frame(standing, {2:[-.42,1.32,.02],3:[.49,1.31,.26],4:[-.61,1.48,.1],5:[.66,1.24,.63]}),
  'tennis-follow': frame(standing, {0:[-.19,1.63,-.12],1:[.19,1.63,.12],2:[-.45,1.3,.08],3:[.06,1.47,.47],4:[-.4,1.62,.27],5:[-.27,1.83,.3]}),
  'gentle-reset': frame(seat, {}),
  'gentle-open': frame(seat, {2:[-.58,1.22,0],3:[.58,1.22,0],4:[-.92,1.04,0],5:[.92,1.04,0]}),
  'gentle-bend': frame(seat, {4:[-.42,1.34,.12],5:[.42,1.34,.12]}),
  'gentle-lift': frame(seat, {2:[-.57,1.24,0],3:[.57,1.24,0],4:[-.88,1.47,0],5:[.88,1.47,0]}),
};

export const sequenceFor = id => {
  const pose = practicePoses.find(p => p.id === id);
  return pose ? practicePoses.filter(p => p.sequence === pose.sequence) : [];
};
