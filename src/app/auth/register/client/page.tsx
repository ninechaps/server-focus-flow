// 此页面专供 macOS 客户端注册使用，刻意不检查浏览器已有的 session cookie。
// 即使管理员已登录 dashboard，本页也始终显示注册表单，
// 确保客户端可以注册独立的 macOS 账号。
import { RegisterForm } from '@/features/auth/components/register-form';

export default function ClientRegisterPage() {
  return <RegisterForm source='client' />;
}
