/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        staleTimes: {
            dynamic: 30
        },
    },
    serverExternalPackages: ["@node-rs/argon2"],
    webpack: (config) => {
        config.resolve.alias['@node-rs/argon2-wasm32-wasi'] = '@node-rs/argon2';
        return config;
    },
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
        ],
    },
    rewrites: () => {
        return [
            {
                source: "/hashtag/:tag",
                destination: "/search?q=%23:tag"
            }
        ]
    },
};

export default nextConfig;

