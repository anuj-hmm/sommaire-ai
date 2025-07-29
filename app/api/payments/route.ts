import {NextRequest, NextResponse } from "next/server";
import {handleCheckoutSessionCompleted} from "@/lib/payments";
import {handleSubscriptionDeleted} from "@/lib/payments";
import Stripe from "stripe"

const stripe= new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = async (req : NextRequest) => {
    const playload= await req.text();
    const sig = req.headers.get("stripe-signature");
    let event;

    const endpointSecret= process.env.STRIPE_WEBHOOK_SECRET!;

    try{
        event = stripe.webhooks.constructEvent(playload,sig!, endpointSecret);

        switch(event.type){
            case "checkout.session.completed":
                console.log("Checkout session completed");
                const sessionId = event.data.object.id;
                const session = await stripe.checkout.sessions.retrieve(sessionId, {
                    expand: ['line_items'],
                });
                await handleCheckoutSessionCompleted({session, stripe});
                break;

            case 'customer.subscription.created':
                    console.log('Customer subscription deleted');
                    const subscription = event.data.object;
                    const subscriptionId = event.data.object.id;
                    await handleSubscriptionDeleted({subscriptionId, stripe});
                    console.log(subscription);
                
                    
                    break;

                default:
                    console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err){
        return NextResponse.json(
            {error:'Failed to trigger webhook', err},
            {status : 400});    
    }

    return NextResponse.json({
        status :"success",
        message : "Hello from Stripe API",
    });
}