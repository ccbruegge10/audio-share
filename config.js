// Audio Share settings. Edit this file on GitHub (it sits next to listener.html and share-audio.html).
//
// TURN relay (Metered.ca): lets people whose network blocks a direct connection still hear the audio.
// In the Metered dashboard: TURN Server > Credentials > Create Credential, then press the "ICE" button
// on its row (it copies the ICE servers array) and paste it below in place of the empty [ ].
// Leave it empty to connect directly only.
// NEVER put your Metered "Secret key" (Developers page) in here: this file is public.
window.AUDIO_SHARE_TURN = {
  iceServers: [],

  // (Alternative, instead of iceServers: a credential's API key and your app name.)
  app: "",
  apiKey: "",
};
