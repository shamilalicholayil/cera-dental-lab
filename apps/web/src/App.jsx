import { useEffect, useState } from "react";

import { getHealth } from "./api/health";

function App() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function checkApi() {
      try {
        const response = await getHealth();

        if (!ignore) {
          setStatus(response.data.status);
        }
      } catch (err) {
        if (!ignore) {
          setStatus("error");

          setError({
            message: err.message,
            requestId: err.requestId,
          });
        }
      }
    }

    checkApi();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main>
      <h1>Cera Dental Lab</h1>

      {status === "loading" && <p>Checking API connection...</p>}

      {status === "ok" && <p>API connected successfully.</p>}

      {status === "error" && (
        <div>
          <p>Unable to connect to the API.</p>

          <p>{error?.message}</p>

          {error?.requestId && <p>Reference: {error.requestId}</p>}
        </div>
      )}
    </main>
  );
}

export default App;
