import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UpgradeRequired from "@/components/common/upgrade-required";
import { hasActivePlan } from "@/lib/users";


export default async function Layout ({
    children,
} :{
    children : React.ReactNode;
}){
    const user = await currentUser();
    if (!user) {
        redirect('/sign-in');
    }

    const email =
        user.emailAddresses && user.emailAddresses.length > 0
            ? user.emailAddresses[0].emailAddress
            : null;

    if (!email) {
        redirect('/sign-in');
    }

    const hasActiveSubscription = await hasActivePlan(email);

    if (!hasActiveSubscription) {
        return <UpgradeRequired />;
    }

    return <>{children}</>
}