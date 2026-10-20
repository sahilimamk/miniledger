-- v8: optional friend phone number per loan, used by the WhatsApp
-- reminder action in the app. Nullable — most loans won't have one.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS friend_phone TEXT;
