
CREATE POLICY "staff read fleet docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='fleet-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload fleet docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='fleet-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update fleet docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='fleet-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "admin delete fleet docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='fleet-documents' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));
