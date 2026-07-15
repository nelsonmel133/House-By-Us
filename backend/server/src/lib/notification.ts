/**
 * Notification dispatch utility.
 *
 * Currently writes to the `notifications` DB table.
 * Future extensions: push WebSocket events via Redis pub/sub, send emails,
 * or trigger SMS via Africa's Talking (popular ZW SMS gateway).
 */

import { db, notifications } from "@house-by-us/drizzle";
import type { NotificationType } from "@house-by-us/drizzle";

export type DispatchNotificationParams = {
  userId: string;
  type: NotificationType;
  message: string;
  actionUrl?: string;
};

/**
 * Create a notification record in the database.
 * This is the single authoritative function for notification creation —
 * all routers should call this instead of inserting directly.
 */
export async function dispatchNotification(
  params: DispatchNotificationParams
): Promise<void> {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    message: params.message,
    actionUrl: params.actionUrl,
    readStatus: false,
  });

  // ── Future: emit to WebSocket room ────────────────────────────────────────
  // await redis.publish(`notifications:${params.userId}`, JSON.stringify(params));

  // ── Future: Africa's Talking SMS for critical notifications ───────────────
  // if (params.type === 'listing_approved' || params.type === 'listing_rejected') {
  //   await smsClient.send({ to: userPhone, message: params.message });
  // }
}
