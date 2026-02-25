import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('termsOfService');
  return { title: t('pageTitle'), robots: { index: false } };
}

export default async function TermsOfServicePage() {
  const t = await getTranslations('termsOfService');

  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        {/* Main Heading */}
        <div className='text-center'>
          <h1 className='text-foreground text-3xl font-bold'>{t('heading')}</h1>
          <p className='text-muted-foreground mt-2 text-sm'>
            {t('lastUpdated')}{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Introduction */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('intro.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('intro.description')}
          </p>
        </section>

        {/* Demo Purpose */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('demo.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('demo.description')}
          </p>
        </section>

        {/* Open Source */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('openSource.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('openSource.description')}
          </p>
        </section>

        {/* No Warranty */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('noWarranty.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('noWarranty.description')}
          </p>
        </section>

        {/* Data Usage */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('dataUsage.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('dataUsage.description')}
          </p>
        </section>

        {/* Changes */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('changes.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('changes.description')}
          </p>
        </section>

        {/* Contact */}
        <section className='border-border border-t pt-4'>
          <p className='text-muted-foreground text-center text-sm'>
            {t('contactNote')}
          </p>
        </section>
      </div>
    </div>
  );
}
