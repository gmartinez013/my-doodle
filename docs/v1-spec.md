# My Doodle — Mobile App V1 Spec

## Purpose
This spec turns the post-Alexa distribution plan into a buildable V1 for a parent-supervised mobile app that generates printable coloring pages from spoken requests.

The goal is not to rebuild everything from the Alexa version immediately. The goal is to ship the thinnest useful version that proves the mobile experience works.

## Product statement
My Doodle lets a child say what they want to color, turns that request into a safe AI-generated black-and-white coloring page, and gives the parent a fast way to save or share it.

## Primary user
Parent with a young child.

## Core use case
A parent opens the app, hands the phone to the child, the child says “a dinosaur with a volcano,” the app converts that into a safe prompt, generates a coloring page, and the parent saves or shares the image.

## Platform decision
**V1 platform: Expo / React Native**

Reason:
- fastest path to cross-platform mobile app
- good enough for a prototype and portfolio artifact
- simpler iteration loop than full native setup
- supports microphone, share sheet, and image handling well enough for V1

## V1 success criteria
V1 is successful if a parent can:
1. tap one button to start voice input
2. see the recognized request as text
3. confirm or edit the request
4. generate a black-and-white coloring page
5. save or share the result in under ~30 seconds total under normal conditions

## V1 features
### 1. Home screen
Single-screen experience with:
- app title
- one large microphone button
- short instruction text
- recent request text area
- generate button
- result preview area
- save/share/regenerate actions

### 2. Speech-to-text
User taps mic and speaks request.

Requirements:
- capture speech into plain text
- support simple kid requests
- show recognized text before generation
- allow manual editing by parent

Examples:
- “a dinosaur with a volcano”
- “a princess in a castle”
- “un carro de carreras”

### 3. Parent confirmation step
Before generation, parent can:
- approve text as-is
- edit text
- cancel and retry

This is both a UX and safety control.

### 4. Generate coloring page
App sends confirmed text to backend.

Backend responsibilities:
- normalize request
- apply kid-safe prompt rules
- generate a black-and-white line-art style image suitable for coloring
- return image URL and metadata

### 5. Result actions
Parent can:
- save image to device
- share image using native share sheet
- regenerate from same prompt

## V1 non-goals
Do not build these in V1 unless they are nearly free:
- account system
- subscriptions or payments
- public gallery/community feed
- printer integrations as a core workflow
- SMS delivery
- advanced prompt history
- analytics dashboard
- full bilingual localization beyond basic prompt support

## UX principles
- one-screen flow
- child-friendly visual simplicity
- parent control at the decision points
- minimal typing
- quick feedback after each action

## Safety requirements
### Allowed content
Only simple, child-safe subjects such as:
- animals
- fantasy creatures
- vehicles
- nature
- friendly characters
- simple scenes

### Disallowed content
Reject or rewrite prompts involving:
- violence
- weapons
- horror/gore
- sexual content
- hateful or abusive content
- copyrighted character names if you want to reduce legal risk in public distribution

### Safety rules
- parent confirms prompt before generation
- backend sanitizes every prompt before model call
- no user-to-user sharing inside app
- no child profile creation
- no persistent personal data required for V1

## Technical architecture
### Frontend
**Stack:** Expo + React Native

Responsibilities:
- microphone UX
- speech-to-text handling
- prompt editing UI
- image preview
- save/share actions
- loading and error states

### Backend
Use a lightweight API layer in front of reusable logic from the Alexa version.

Recommended endpoint:

`POST /generate-coloring-page`

Request body:
```json
{
  "prompt": "a dinosaur with a volcano",
  "language": "en",
  "client": "mobile-v1"
}
```

Response body:
```json
{
  "imageUrl": "https://...",
  "finalPrompt": "A kid-safe black and white coloring page of a friendly dinosaur standing near a volcano, line art, no shading, simple outlines",
  "requestId": "abc123"
}
```

### Reusable backend modules from Alexa version
Audit for reuse:
- prompt transformation logic
- content safety filters
- OpenAI image generation wrapper
- image storage/upload logic

Do not carry over Alexa-specific request/response orchestration.

## Performance expectations
- speech recognition feedback should feel immediate
- generation should ideally complete within 10–20 seconds
- loading state should clearly show progress
- failures should return a friendly retry path

## Error handling
User-friendly errors only.

Cases:
- speech not recognized → “Try saying that again.”
- unsafe request → “Try a different idea.”
- generation failure → “Something went wrong. Try again.”
- network issue → “Check connection and retry.”

## Basic screen states
- idle
- listening
- text captured
- generating
- result ready
- error

## Suggested repo structure
```text
/mobile-app
  /app
  /components
  /lib
  /services
  /assets
/docs
  distribution-plan.md
  v1-spec.md
/backend
  /api
  /shared
```

## Milestones
### Milestone 1 — architecture extraction
- identify reusable Alexa backend logic
- separate Alexa-specific handlers from shared generation logic
- define API contract

### Milestone 2 — mobile shell
- create Expo app
- build one-screen UI
- implement local text input fallback before speech

### Milestone 3 — voice flow
- add speech-to-text
- show/edit recognized prompt
- connect to backend

### Milestone 4 — result flow
- render result image
- add save/share/regenerate

### Milestone 5 — polish
- loading states
- safety copy
- README screenshots
- short demo video

## Portfolio framing
This project should be presented as:
- a real family problem
- an AI-enabled kid-safe product
- a platform-pivot case study
- an example of building around distribution constraints instead of pretending they do not exist

## Open decisions
1. Should V1 require parent tap-to-confirm before every generation? **Recommended: yes**
2. Should bilingual input be supported in V1? **Recommended: accept both if easy, don’t market it as a core feature yet**
3. Should printing be included in V1? **Recommended: no, save/share first**
4. Which image model should be used for line-art reliability and cost? **Need evaluation**

## Final recommendation
Build the thinnest working mobile loop first:
**speak → confirm → generate → save/share**

If that loop is fast, safe, and delightful, you have a real product foundation and a much stronger portfolio story than the Alexa version alone.
