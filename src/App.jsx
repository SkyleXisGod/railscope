import { useEffect } from "react";
import { getOperations } from "./frontend/operations.js";

function App() {
  useEffect(() => {
  getOperations().then(data => {
    console.log("Dane z API:", data);
    setTrains(data); 
  });
}, []);

  return (
    <div>
      <h1>Railscope działa</h1>
      <p>Sprawdź konsolę</p>
    </div>
  );
}

export default App;