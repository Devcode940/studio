
import { AuthForm } from "@/components/auth/AuthForm";
import { MainLayout } from "@/components/layout/MainLayout"; // Using MainLayout for consistency

export default function LoginPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <AuthForm />
      </div>
    </MainLayout>
  );
}
