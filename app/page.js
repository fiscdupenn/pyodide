"use client";

import { useEffect, useRef, useState } from "react";

const PyodidePlot = () => {
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSrc, setDataSrc] = useState(null);
  const pyodideRef = useRef(null);

  useEffect(() => {
    const loadPyodideScript = async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js";
      script.onload = async () => {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/",
        });
        await pyodideInstance.loadPackage("micropip");
        await pyodideInstance.runPythonAsync(`
            import micropip
            await micropip.install('numpy')
        `);
        pyodideRef.current = pyodideInstance;
        setPyodideLoading(false);
      };
      document.body.appendChild(script);
    };

    loadPyodideScript();
  }, []);

  const generateData = async () => {
    if (!pyodideRef.current) return;

    setDataLoading(true);

    const pythonCode = `
      import numpy as np
      def assign_to_treatment(K):
          untreated = np.zeros(K)
          treated = np.ones(K)
          overall_population = np.concatenate((treated, untreated))
          assignment = np.random.permutation(overall_population)
          return assignment.tolist()
      
      assign_to_treatment(6)
    `;

    try {
      const outData = await pyodideRef.current.runPythonAsync(pythonCode);
      setDataSrc(outData);
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div>
      {pyodideLoading && <p>Loading Pyodide...</p>}
      {!pyodideLoading && (
        <button onClick={generateData} disabled={dataLoading}>
          {dataLoading ? "Generating Data..." : "Generate Data"}
        </button>
      )}
      {dataSrc && (
        <div>
          <h3>Generated Data:</h3>
          {dataSrc}
        </div>
      )}
    </div>
  );
};

export default PyodidePlot;