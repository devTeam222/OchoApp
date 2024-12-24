import { Metadata } from "next";
import Notifications from "./Notifications";
import TrendsSidebar from "@/components/TrendsSidebar";
import { getTranslation } from "@/lib/language";

export async function generateMetadata() {
  const { notifications } = await getTranslation();
  return {
    title: notifications,
  };
}

export default async function Page() {
  const { activityCenter } = await getTranslation();
  return (
    <>
      <div className="w-full min-w-0 max-w-lg space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">{activityCenter}</h2>
        </div>
        <Notifications />
      </div>
      <TrendsSidebar />
    </>
  );
}
