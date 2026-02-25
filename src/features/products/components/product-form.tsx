'use client';

import { FormFileUpload } from '@/components/forms/form-file-upload';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Product } from '@/constants/mock-api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslations } from 'next-intl';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const formSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.'
  }),
  category: z.string(),
  price: z.number(),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.'
  })
});

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const t = useTranslations('products.form');
  const defaultValues = {
    name: initialData?.name || '',
    category: initialData?.category || '',
    price: initialData?.price || undefined,
    description: initialData?.description || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const router = useRouter();

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Form submission logic would be implemented here
    console.log(values);
    router.push('/dashboard/product');
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <FormFileUpload
            control={form.control}
            name='image'
            label={t('imageLabel')}
            description={t('imageDescription')}
            config={{
              maxSize: 5 * 1024 * 1024,
              maxFiles: 4
            }}
          />

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='name'
              label={t('nameLabel')}
              placeholder={t('namePlaceholder')}
              required
            />

            <FormSelect
              control={form.control}
              name='category'
              label={t('categoryLabel')}
              placeholder={t('categoryPlaceholder')}
              required
              options={[
                { label: t('categories.beauty'), value: 'beauty' },
                { label: t('categories.electronics'), value: 'electronics' },
                { label: t('categories.home'), value: 'home' },
                { label: t('categories.sports'), value: 'sports' }
              ]}
            />

            <FormInput
              control={form.control}
              name='price'
              label={t('priceLabel')}
              placeholder={t('pricePlaceholder')}
              required
              type='number'
              min={0}
              step='0.01'
            />
          </div>

          <FormTextarea
            control={form.control}
            name='description'
            label={t('descriptionLabel')}
            placeholder={t('descriptionPlaceholder')}
            required
            config={{
              maxLength: 500,
              showCharCount: true,
              rows: 4
            }}
          />

          <Button type='submit'>{t('submit')}</Button>
        </Form>
      </CardContent>
    </Card>
  );
}
