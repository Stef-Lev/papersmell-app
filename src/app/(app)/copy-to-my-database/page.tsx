import { Suspense } from "react";
import CopyToMyDatabasePage from "@/components/pages/copy-to-my-database-page/copy-to-my-database-page";
import RouteLoading from "@/components/route-loading/route-loading";

export default function Page() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <CopyToMyDatabasePage />
    </Suspense>
  );
}
