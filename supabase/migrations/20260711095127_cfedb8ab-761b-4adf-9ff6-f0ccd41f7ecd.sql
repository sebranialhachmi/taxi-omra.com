
REVOKE ALL ON FUNCTION public.trg_bookings_recompute_driver() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_driver_stats(uuid) FROM PUBLIC, anon, authenticated;
