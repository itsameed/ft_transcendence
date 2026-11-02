import { useDebugValue, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "lucide-react";

export function ChatPage(){
   const [me, setMe] = useState<User | null>(null)
   
   useEffect(()=>{
      async function loadChat() {
         const res = await fetch()
      }
   })


}