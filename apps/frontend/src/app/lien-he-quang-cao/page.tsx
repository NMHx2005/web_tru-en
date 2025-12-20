'use client';

import { Suspense } from 'react';
import { PageContent } from '@/components/pages/page-content';
import { Loading } from '@/components/ui/loading';

function ContactAdvertisingContent() {
  return <PageContent slug="lien-he-quang-cao" fallbackTitle="Liên hệ quảng cáo" />;
}

export default function ContactAdvertisingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    }>
      <ContactAdvertisingContent />
    </Suspense>
  );
}

