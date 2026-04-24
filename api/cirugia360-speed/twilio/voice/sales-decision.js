import voiceHandler from "./[action].js";

export default function handler(request, response) {
  request.query = {
    ...(request.query || {}),
    action: "sales-decision",
  };

  return voiceHandler(request, response);
}
