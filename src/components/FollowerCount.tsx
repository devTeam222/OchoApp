"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";
import FormattedInt from "./FormattedInt";

interface FollowerCountProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowerCount({
  userId,
  initialState,
}: FollowerCountProps) {
  const { data } = useFollowerInfo(userId, initialState);

  return (
    <span>
      <span className="font-semibold">
        <FormattedInt number={data.followers} />
      </span>{" "}
      Follower{data.followers > 1 ? "s" : ""}
    </span>
  );
}
