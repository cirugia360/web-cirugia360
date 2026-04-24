import voiceHandler from "./[action].js";

export default function handler(request, response) {
  request.query = {
    ...(request.query || {}),
    action: "customer-complete",
  };

  return voiceHandler(request, response);
}
