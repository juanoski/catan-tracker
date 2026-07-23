import { ArrowLeft } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showMobileBack = location.pathname !== "/";

  function handleBack() {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {showMobileBack && (
          <div className="mb-4 md:hidden">
            <Button type="button" variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
