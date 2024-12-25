/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        staleTimes: {
            dynamic: 30
        },
    },
    serverExternalPackages: ["@node-rs/argon2"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "utfs.io",
                pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/*`
            },
            {
                protocol: "https",
                hostname: "platform-lookaside.fbsbx.com",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "/u/*"
            },
        ],
    },
    rewrites: () => {
        return [
            {
                source: "/hashtag/:tag",
                destination: "/search?q=%23:tag"
            },
            {
                source: "/:username",
                destination: "/users/:username"
            },
            {
                source: "/explore",
                destination: "/search"
            },
            {
                source: "/messages/chat",
                destination: "/messages"
            },
        ]
    },
};

export default nextConfig;
