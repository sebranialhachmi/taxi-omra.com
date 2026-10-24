
CREATE POLICY "customer_docs_staff_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'customer-documents' AND is_staff(auth.uid()));
CREATE POLICY "customer_docs_staff_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-documents' AND is_staff(auth.uid()));
CREATE POLICY "customer_docs_staff_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'customer-documents' AND is_staff(auth.uid()));
CREATE POLICY "customer_docs_staff_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-documents' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
