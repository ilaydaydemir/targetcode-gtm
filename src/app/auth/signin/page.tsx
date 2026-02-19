import AuthForm from '@/components/auth/AuthForm'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthForm mode="signin" />
    </div>
  )
}
