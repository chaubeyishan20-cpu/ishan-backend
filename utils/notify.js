import Notification from "../models/Notification.js";

export async function notify(userId, message, link = "") {
  try {
    await Notification.create({ user: userId, type: "info", message, link });
  } catch (error) {
    console.error("notify error:", error.message);
  }
}