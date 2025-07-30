import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UpgradeRequired from "@/components/common/upgrade-required";
import { hasActivePlan } from "@/lib/users";


export default async function Layout ({
    children,
} :{
    children : React.ReactNode;
}){
    const user= await currentUser
    if(!user){
        redirect('/sign-in');
    }

    const hasActiveSubscription =await hasActivePlan(user);

    if (!hasActiveSubscription){
       return <UpgradeRequired/>;
    }

    return <>{children}</>
}