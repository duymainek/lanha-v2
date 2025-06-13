import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "../components/login-form"

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document !== "undefined" && document.cookie.includes("auth_token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Là Nhà.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://zlwuqqwemjiaxztgsfkd.supabase.co/storage/v1/object/public/website-images/banner_1_uyzydqcdf2.jpeg"
          alt="Login banner"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
} 