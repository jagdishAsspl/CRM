const withNextIntl = require("next-intl/plugin")(
  "./i18n/request.ts"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "localhost" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "minio-cwg0o4ss0scoccgwso8sk004.coolify.cz" },
      { protocol: "http", hostname: "minio" },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
  async redirects() {
    return [
      {
        source: "/:locale/crm/targets/:path*",
        destination: "/:locale/campaigns/targets/:path*",
        permanent: true,
      },
      {
        source: "/:locale/crm/target-lists/:path*",
        destination: "/:locale/campaigns/target-lists/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
