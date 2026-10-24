
REVOKE EXECUTE ON FUNCTION public.recompute_customer_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bookings_recompute_customer() FROM PUBLIC, anon, authenticated;
