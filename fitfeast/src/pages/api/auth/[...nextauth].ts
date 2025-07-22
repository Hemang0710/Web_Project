import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/app/models/User";
import dbConnect from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) throw new Error("Missing credentials");
        await dbConnect();
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select("+password");
        if (!user) throw new Error("No user found with this email");
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");
        return { id: user._id, name: user.name, email: user.email };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day in seconds
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token._id = dbUser._id.toString();
          token.sub = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token._id) {
        (session.user as any)._id = token._id;
      }
      return session;
    },
  },
}); 