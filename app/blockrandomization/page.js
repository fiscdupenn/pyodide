"use client"

import { useEffect, useState } from "react";

const PyodidePlot = () => {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSrc, setDataSrc] = useState(null);

  useEffect(() => {
    // Dynamically load Pyodide script
    const loadPyodideScript = async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js";
      script.onload = async () => {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/",
        });
        // Ensure libraries are loaded/installed
        await pyodideInstance.loadPackage("micropip");
        await pyodideInstance.runPythonAsync(`
            import micropip
            await micropip.install('numpy')
        `);
        setPyodide(pyodideInstance);
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    loadPyodideScript();
  }, []);

  const generateData = async () => {
    if (!pyodide) return;

    setLoading(true);

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
      // Execute the Python code
      const outData = await pyodide.runPythonAsync(pythonCode);
      setDataSrc(outData)
    } catch (error) {
      console.error("Error generating data:", error);
    }

    setLoading(false);
  };

  return (
    <div>
      {loading && <p>Loading Pyodide...</p>}
      {!loading && <button onClick={generateData}>Generate Data</button>}
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