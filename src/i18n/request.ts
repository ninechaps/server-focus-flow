import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import enMessages from '../messages/en.json';
import zhMessages from '../messages/zh.json';

const MESSAGES: Record<string, typeof enMessages> = {
  en: enMessages,
  zh: zhMessages
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get('NEXT_LOCALE')?.value ?? 'en';
  const valid = ['en', 'zh'].includes(locale) ? locale : 'en';
  return {
    locale: valid,
    messages: MESSAGES[valid]
  };
});
