import voiceHandler from "./[action].js";

export default function handler(request, response) {
  request.query = {
    ...(request.query || {}),
    action: "sales-intro",
  };

  return voiceHandler(request, response);
}
