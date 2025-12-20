'use client';

import { Suspense } from 'react';
import { PageContent } from '@/components/pages/page-content';
import { Loading } from '@/components/ui/loading';

function PartnershipContent() {
  return <PageContent slug="doi-tac-hop-tac" fallbackTitle="Đối tác hợp tác" />;
}

export default function PartnershipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFF2F8] dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    }>
      <PartnershipContent />
    </Suspense>
  );
}

