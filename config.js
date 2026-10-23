// Audio Share settings. Edit this file on GitHub (it sits next to listener.html and share-audio.html).
//
// TURN relay (Metered.ca): lets people whose network blocks a direct connection still hear the audio.
// From your Metered dashboard, copy your app name (the "yourapp" part of yourapp.metered.live) and an
// API key. Leave both empty to connect directly only.
// Note: this file is public, so anyone could find the key; the most they could do is use up your
// free relay allowance.
window.AUDIO_SHARE_TURN = {
  var myPeerConnection = new RTCPeerConnection({
  iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:standard.relay.metered.ca:80",
        username: "091d7779d39c48a67f3d6506",
        credential: "t6CN/x/SuxHRY7iW",
      },
      {
        urls: "turn:standard.relay.metered.ca:80?transport=tcp",
        username: "091d7779d39c48a67f3d6506",
        credential: "t6CN/x/SuxHRY7iW",
      },
      {
        urls: "turn:standard.relay.metered.ca:443",
        username: "091d7779d39c48a67f3d6506",
        credential: "t6CN/x/SuxHRY7iW",
      },
      {
        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
        username: "091d7779d39c48a67f3d6506",
        credential: "t6CN/x/SuxHRY7iW",
      },
  ],
});
};
