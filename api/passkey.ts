import { Fido2Lib } from "fido2-lib";

export const f2l = new Fido2Lib({
  rpId: "localhost",
  rpName: "로코모에",
  timeout: 6 * 10 * 10 * 1000,
  rpIcon: "https://roco.moe/apple-icon.png",
  challengeSize: 32,
  attestation: "none",
  //   cryptoParams: [-7, -257],
  //   authenticatorAttachment: "platform",
  //   authenticatorRequireResidentKey: false,
  //   authenticatorUserVerification: "required",
});
