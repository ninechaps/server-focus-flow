import PageContainer from '@/components/layout/page-container';
import { ProfilePage } from '@/features/profile/components/profile-page';

export const metadata = {
  title: 'Dashboard: Profile'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Profile'
      pageDescription='View your profile and statistics.'
    >
      <ProfilePage />
    </PageContainer>
  );
}
