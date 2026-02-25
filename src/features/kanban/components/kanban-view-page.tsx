import PageContainer from '@/components/layout/page-container';
import { getTranslations } from 'next-intl/server';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default async function KanbanViewPage() {
  const t = await getTranslations('kanban');

  return (
    <PageContainer
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
      pageHeaderAction={<NewTaskDialog />}
    >
      <KanbanBoard />
    </PageContainer>
  );
}
