
-- Revoke public EXECUTE on trigger-only / internal SECURITY DEFINER functions.
-- These are invoked by triggers or server-side code, never directly from clients.
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN
    SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'handle_new_user','log_booking_activity','trg_bookings_recompute_customer',
        'trg_bookings_recompute_driver','trg_refund_apply','trg_booking_autoinvoice',
        'trg_task_completed_stamp','trg_cms_pages_status_sync','trg_new_permission_grants_admin',
        'recompute_customer_stats','recompute_driver_stats',
        'gen_invoice_number','gen_payment_number','blog_compute_reading_time','set_updated_at'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- Role/permission helpers are invoked from RLS policies; keep them available to signed-in users
-- but revoke from anon (policies for anon don't need them).
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_finance(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_permissions(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_finance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_permissions(uuid) TO authenticated;
