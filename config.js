// Audio Share settings. Edit this file on GitHub (it sits next to listener.html and share-audio.html).
//
// TURN relay (Metered.ca): lets people whose network blocks a direct connection still hear the audio.
// In the Metered dashboard: TURN Server > Credentials > Create Credential, then press the "ICE" button
// on its row (it copies the ICE servers array) and paste it below in place of the list.
// Leave the list empty ([]) to connect directly only.
// NEVER put your Metered "Secret key" (Developers page) in here: this file is public.
window.AUDIO_SHARE_TURN = {
  iceServers: [
    { urls: "stun:stun.relay.metered.ca:80" },
    { urls: "turn:standard.relay.metered.ca:80", username: "091d7779d39c48a67f3d6506", credential: "t6CN/x/SuxHRY7iW" },
    { urls: "turn:standard.relay.metered.ca:80?transport=tcp", username: "091d7779d39c48a67f3d6506", credential: "t6CN/x/SuxHRY7iW" },
    { urls: "turn:standard.relay.metered.ca:443", username: "091d7779d39c48a67f3d6506", credential: "t6CN/x/SuxHRY7iW" },
    { urls: "turns:standard.relay.metered.ca:443?transport=tcp", username: "091d7779d39c48a67f3d6506", credential: "t6CN/x/SuxHRY7iW" },
  ],
};
