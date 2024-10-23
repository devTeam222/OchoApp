"use client"

import { NavigationType } from "@/lib/types";
import { useNavigation } from "@/context/NavigationContext";



interface SetNavigationProps{
    navPage: NavigationType
}

export default function SetNavigation({navPage} : SetNavigationProps) {
    const {setCurrentNavigation} = useNavigation();
    setCurrentNavigation(navPage)
   return <span className="hidden"></span>
};
