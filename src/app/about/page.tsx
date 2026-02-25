import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return { title: t('pageTitle') };
}

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
            {t('heading')}
          </h1>
          <p className='text-muted-foreground mt-4 text-lg'>
            {t('subheading')}
          </p>
        </div>

        {/* Content Sections */}
        <div className='space-y-8'>
          {/* Open Source Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>
              {t('openSource.title')}
            </h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              {t('openSource.description')}
            </p>
          </section>

          {/* Demo Purpose Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>
              {t('demo.title')}
            </h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              {t('demo.description')}
            </p>
          </section>

          {/* Auth Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>
              {t('auth.title')}
            </h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              {t('auth.description')}
            </p>
          </section>

          {/* Data Privacy Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>
              {t('privacy.title')}
            </h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              {t('privacy.description')}
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className='mt-12 text-center'>
          <p className='text-muted-foreground text-sm'>{t('footer')}</p>
        </div>
      </div>
    </div>
  );
}
