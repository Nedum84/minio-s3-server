import { app } from "./app";

const PORT = "8000";
//Start mongoose & event bus
const start = async () => {
  const server = app.listen(PORT, async () => {
    console.log(`Listening on http://localhost:${PORT}`);
  });
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("Server closed");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: any) => {
    console.error(error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", () => {
    console.info("SIGTERM received");
    if (server) {
      server.close();
    }
  });
  process.once("SIGUSR2", function () {
    process.kill(process.pid, "SIGUSR2");
  });

  process.on("SIGINT", function () {
    // this is only called on ctrl+c, not restart
    process.kill(process.pid, "SIGINT");
  });
};

start();
