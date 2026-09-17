# Align stretching studio

A browser-only prototype using Three.js 0.180.0 and MediaPipe Tasks Vision 0.10.21.

Serve `dist/` over HTTPS (or localhost). There is no build step. Camera access is opt-in; frames are processed locally and never uploaded. Libraries, fonts and the pose model load from third-party CDNs, so the first visit requires network access.

Includes overhead reach, standing side bend, Mountain pose and Warrior II, a rotatable 3D reference, mirrored camera landmarks, visibility-gated alignment feedback, and an independent manual hold timer. The movement definitions and pure pose checks are separated to support future exercises.

## Limitations

This is not clinically validated. Rules check a few 2D landmark relationships, not pain, joint loading, balance, depth, or injury risk. Thresholds are illustrative product heuristics and must be reviewed by qualified movement professionals before safety-related use. Poor framing, camera angle, occlusion and clothing can produce inaccurate feedback. Never interpret a matching reference as a guarantee of safe form. Lifting and additional exercises are not yet included.

## Verification

JavaScript syntax and pure-rule checks passed for joint angles, reference alignment, misalignment, missing landmarks, and low-confidence landmarks. Local HTTP preview responds successfully. Native browser automation was unavailable in the execution environment, so live webcam/model inference, visual rendering and experimental WebMCP integration require an in-browser acceptance check.
