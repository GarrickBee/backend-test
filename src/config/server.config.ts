namespace ServerConfig {
  // * Database Connection
  const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : "local";

  // * Check is production
  export function isProduction(): Readonly<boolean> {
    return NODE_ENV === "production";
  }

  // * Check is development
  export function isDevelopment(): Readonly<boolean> {
    return NODE_ENV === "development";
  }

  // * Check is local
  export function isLocal(): Readonly<boolean> {
    return NODE_ENV === "local";
  }
}

export default ServerConfig;
