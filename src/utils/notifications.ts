import type { NotificationState } from "../types";

export const createNotification = (
  setter: React.Dispatch<React.SetStateAction<NotificationState>>,
  type: "success" | "error",
  message: string,
) => {
  setter({ type, message, show: true });
  setTimeout(() => {
    setter((prev) => ({ ...prev, show: false }));
  }, 4000);
};
