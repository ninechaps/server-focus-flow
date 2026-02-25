import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacyPolicy');
  return { title: t('pageTitle'), robots: { index: false } };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations('privacyPolicy');

  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        {/* Main Heading */}
        <h1 className='text-foreground text-3xl font-bold'>{t('heading')}</h1>

        {/* Introduction */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('intro.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('intro.description')}
          </p>
        </section>

        {/* Data Collection */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('dataCollection.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('dataCollection.description')}
          </p>
        </section>

        {/* Auth */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('authSection.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('authSection.description')}
          </p>
        </section>

        {/* No data misuse */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('noMisuse.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('noMisuse.description')}
          </p>
        </section>

        {/* Demo purpose */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('demoApp.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('demoApp.description')}
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            {t('contact.title')}
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            {t('contact.description')}
          </p>
        </section>

        {/* Last Updated */}
        <div className='border-border border-t pt-4'>
          <p className='text-muted-foreground text-sm'>{t('lastUpdated')}</p>
        </div>
      </div>
    </div>
  );
}
