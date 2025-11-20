// script.js

// ───────────────────────────────────────────────
// Parse username + room from URL
// ───────────────────────────────────────────────
const query = new URLSearchParams(window.location.search);
const username = query.get("username");
const roomName = query.get("room");

// Globals
let room;
let localVideoTrack;
let localAudioTrack;

// ───────────────────────────────────────────────
// Request Twilio Token
// ───────────────────────────────────────────────
async function getToken() {
    const res = await fetch("/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, room: roomName })
    });

    const data = await res.json();
    return data.token;
}

// ───────────────────────────────────────────────
// Start Video Call
// ───────────────────────────────────────────────
async function startCall() {
    // Step 1: Get local camera + microphone
    const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    // Create Twilio video + audio tracks
    localVideoTrack = new Twilio.Video.LocalVideoTrack(localStream.getVideoTracks()[0]);
    localAudioTrack = new Twilio.Video.LocalAudioTrack(localStream.getAudioTracks()[0]);

    // Attach YOUR own video immediately (so black screen disappears)
    addLocalVideo(localVideoTrack);

    // Step 2: Get Twilio JWT token
    const token = await getToken();

    // Step 3: Connect to Room
    room = await Twilio.Video.connect(token, {
        name: roomName,
        tracks: [localAudioTrack, localVideoTrack]
    });

    console.log("Connected to room:", room.name);

    // Step 4: Add existing remote participants
    room.participants.forEach(p => attachParticipant(p));

    // Step 5: Add new participants when joining
    room.on("participantConnected", p => attachParticipant(p));

    // Step 6: Remove on disconnect
    room.on("participantDisconnected", p => detachParticipant(p));
}

// ───────────────────────────────────────────────
// Attach your local video to DOM
// ───────────────────────────────────────────────
function addLocalVideo(track) {
    // Remove if already exists
    const existing = document.getElementById("local");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "local";
    div.className = "video-box";

    const videoEl = track.attach();
    videoEl.style.width = "300px";
    videoEl.style.borderRadius = "10px";

    div.appendChild(videoEl);
    document.getElementById("videos").appendChild(div);
}

// ───────────────────────────────────────────────
// Handle remote participants
// ───────────────────────────────────────────────
function attachParticipant(participant) {
    const div = document.createElement("div");
    div.id = participant.sid;
    div.className = "video-box";

    participant.tracks.forEach(pub => {
        if (pub.isSubscribed) {
            const video = pub.track.attach();
            video.style.width = "300px";
            div.appendChild(video);
        }
    });

    // when new track is added later
    participant.on("trackSubscribed", track => {
        const video = track.attach();
        video.style.width = "300px";
        div.appendChild(video);
    });

    document.getElementById("videos").appendChild(div);
}

// Remove participant video
function detachParticipant(participant) {
    const div = document.getElementById(participant.sid);
    if (div) div.remove();
}

// ───────────────────────────────────────────────
// BUTTON CONTROLS
// ───────────────────────────────────────────────
document.getElementById("muteBtn").onclick = () => {
    if (localAudioTrack.isEnabled) {
        localAudioTrack.disable();
        muteBtn.innerText = "Unmute";
    } else {
        localAudioTrack.enable();
        muteBtn.innerText = "Mute";
    }
};

document.getElementById("videoBtn").onclick = () => {
    if (localVideoTrack.isEnabled) {
        localVideoTrack.disable();
        videoBtn.innerText = "Camera On";
    } else {
        localVideoTrack.enable();
        videoBtn.innerText = "Camera Off";
    }
};

document.getElementById("leaveBtn").onclick = () => {
    if (room) room.disconnect();
    window.location.href = "index.html";
};

// ───────────────────────────────────────────────
// Start the call immediately
// ───────────────────────────────────────────────
startCall();