import DashBoardNav from "@/components/DashBoardNav";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

async function getData({email, id, firstName, lastName, profileImage} :
    {email: string, id: string, firstName: string | undefined | null, lastName: string | undefined | null, profileImage: string | undefined | null
    }
) {
    if (!id) {
        // If id is undefined, return early or handle the error as needed
        return;
    }
    const user = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            stripeCustomerId: true
        }
    })

    if(!user) {
        const name = `${firstName ?? ""} ${lastName ?? ""}`
        await prisma.user.create({
            data: {
                id: id,
                email: email,
                name: name,
            }
        });

    }
    if(!user?.stripeCustomerId) {
        const data = await stripe.customers.create({
            email: email
        });

        await prisma.user.update({
            where: {
                id: id
            },
            data: {
                stripeCustomerId: data.id
            }
        });
    }
}   
export default async function DashBoardLayout({children} : {children: React.ReactNode}) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    await getData({
        email: user?.email as string,
        id: user?.id as string,
        firstName: user?.family_name as string,
        lastName: user?.given_name as string,
        profileImage: user?.picture as string
    })
    if(!user) {
        return redirect('/')
    }

    return (
        <div className=" flex flex-col space-y-6 mt-10">
            <div className=" container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
                <aside className=" hidden w-[200px] flex-col md:flex">
                    <DashBoardNav />
                </aside>
                <main>
                    {children}
                </main>
            </div>
        </div>
    )
}