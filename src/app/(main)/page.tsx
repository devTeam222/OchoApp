import PostEditor from "@/components/posts/editors/PostEditor";
import TrendsSidebar from "@/components/TrendsSidebar";
import ForYouFeed from "./ForYouFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowingFeed from "./FollowingFeed";
import SetNavigation from "@/components/SetNavigation";

export default function Home() {
  return (
    <main className="flex w-full min-w-0 gap-5 max-sm:pb-4 h-fit">
      <SetNavigation navPage="home" />
      <div className="w-full min-w-0 space-y-2 sm:space-y-5">
        <PostEditor />
        <Tabs defaultValue="for-you">
          <TabsList>
            <TabsTrigger value="for-you">Pour toi</TabsTrigger>
            <TabsTrigger value="following">Suivis</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <ForYouFeed />
          </TabsContent>
          <TabsContent value="following">
            <FollowingFeed />
          </TabsContent>
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}
