-- Add error tracking columns to messages table for failed delivery details
alter table "public"."messages" add column "error_code" integer;
alter table "public"."messages" add column "error_message" text;

-- Update the failed status RPC to accept and store error details
CREATE OR REPLACE FUNCTION public.update_message_failed_status(
  wam_id_in text,
  failed_at_in timestamp with time zone,
  error_code_in integer default null,
  error_message_in text default null
)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$DECLARE
  failed_at_existing TIMESTAMPTZ;
  successful bool;
BEGIN
  SELECT failed_at INTO failed_at_existing
  FROM messages
  WHERE wam_id = wam_id_in
  LIMIT 1 FOR UPDATE;
  if failed_at_existing is not null then
    successful := false;
  ELSE
    UPDATE messages
    SET failed_at = failed_at_in,
        error_code = error_code_in,
        error_message = error_message_in
    WHERE wam_id = wam_id_in;
    successful := true;
  END IF;
  RETURN successful;
END;
$function$;
