import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        // If not, create a new one and redirect to subscription
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? "",
              image: user.image ?? "",
              renewSubscription: new Date(), // default to now
            },
          });
        }

        return true;
      } catch (err) {
        console.error("Sign-in error:", err);
        return false;
      }
    },

    async session({ session }) {
      if (!session?.user?.email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});
