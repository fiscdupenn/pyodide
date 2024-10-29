"use client";

import { useEffect, useRef, useState } from "react";

const PyodidePlot = () => {
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSrc, setDataSrc] = useState(null);
  const [plotReady, setPlotReady] = useState(false);

  const [pythonCode, setPythonCode] = useState(`
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64

# Create synthetic data
np.random.seed(0)
data_size = 100
x = np.random.rand(data_size) * 10  # Random numbers between 0 and 10
y = 2.5 * x + np.random.randn(data_size) * 5  # Linear relationship with some noise

# Create a DataFrame
data = pd.DataFrame({'x': x, 'y': y})

# Plot with Seaborn
plt.figure(figsize=(10, 6))
sns.regplot(x='x', y='y', data=data)
plt.title("Seaborn Regression Plot")
plt.xlabel("X values")
plt.ylabel("Y values")

# Save plot to a base64 string
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
img_str = base64.b64encode(buf.read()).decode('utf-8')
img_str
  `);

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
        // Load only essential packages first
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install('numpy')
          await micropip.install('pandas')
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

    await pyodideRef.current.runPythonAsync(`
      import micropip
      await micropip.install('matplotlib')
      await micropip.install('seaborn')
    `);

    try {
      const outData = await pyodideRef.current.runPythonAsync(pythonCode);
      setDataSrc(`data:image/png;base64,${outData}`);
      setPlotReady(true);
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <div>
      <h1>Pyodide - Run Python Code in a Next.js Webpage</h1>
      <h2>This webpage generates a plot written in Python using matplotlib and seaborn.</h2>
      {pyodideLoading && !plotReady && <p>Loading Pyodide...</p>}
      {!pyodideLoading && (
        <>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            rows={30}
            cols={95}
          />
          <br></br>
          <button onClick={generateData} disabled={dataLoading}>
            {dataLoading ? "Generating Plot..." : "Generate Plot"}
          </button>
        </>
      )}
      {dataSrc && (
        <div>
          <h3>Generated Plot</h3>
          <img src={dataSrc} alt="Generated Plot" />
        </div>
      )}
    </div>
  );
};

export default PyodidePlot;