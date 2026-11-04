import { Suspense } from "react";
import AddToMyDatabasePage from "@/components/pages/add-to-my-database-page/add-to-my-database-page";
import RouteLoading from "@/components/route-loading/route-loading";

export default function Page() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AddToMyDatabasePage />
    </Suspense>
  );
}
