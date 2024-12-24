import PostEditor from "@/components/posts/editors/PostEditor";
import TrendsSidebar from "@/components/TrendsSidebar";
import ForYouFeed from "./ForYouFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowingFeed from "./FollowingFeed";
import SetNavigation from "@/components/SetNavigation";
import { VocabularyKey } from "@/lib/vocabulary";
import { getTranslation } from "@/lib/language";

export default async function Home() {

  const { forYou, followings } = await getTranslation();
  return (
    <>
      <SetNavigation navPage="home" />
      <div className="w-full min-w-0 space-y-2 sm:space-y-2.5 max-w-lg">
        <PostEditor />
        <Tabs defaultValue="for-you">
          <TabsList>
            <TabsTrigger value="for-you">{forYou}</TabsTrigger>
            <TabsTrigger value="following">{followings}</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you" className="pb-2">
            <ForYouFeed />
          </TabsContent>
          <TabsContent value="following" className="pb-2">
            <FollowingFeed />
          </TabsContent>
        </Tabs>
      </div>
      <TrendsSidebar />
    </>
  );
}
