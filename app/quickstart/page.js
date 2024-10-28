"use client";

import { useEffect, useState } from "react";

const PyodidePlot = () => {
  const [pyodide, setPyodide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSrc, setDataSrc] = useState(null);
  const [plotReady, setPlotReady] = useState(false);

  useEffect(() => {
    const loadPyodideScript = async () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js";
      script.async = true;
      script.onload = async () => {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.2/full/",
        });
        await pyodideInstance.loadPackage("micropip");

        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install('numpy')
          await micropip.install('pandas')
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

    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install('matplotlib')
      await micropip.install('seaborn')
    `);

    const pythonCode = `
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import js

# Use JavaScript's fetch to load the CSV file
response = await js.fetch("/penguins.csv")
csv_text = await response.text()

# Load the dataset from the CSV text
from io import StringIO
df = pd.read_csv(StringIO(csv_text))

sns.pairplot(df, hue="species")

# Save plot to a base64 string
buffer = BytesIO()
plt.savefig(buffer, format='png')
buffer.seek(0)
encoded_image = base64.b64encode(buffer.read()).decode('utf-8')
encoded_image
    `;

    try {
      const outData = await pyodide.runPythonAsync(pythonCode);
      setDataSrc(`data:image/png;base64,${outData}`);
      setPlotReady(true);
    } catch (error) {
      console.error("Error generating data:", error);
    }

    setLoading(false);
  };

  return (
    <div>
      {loading && <p>Loading Pyodide...</p>}
      {!loading && !plotReady && <button onClick={generateData}>Generate Plot</button>}
      {dataSrc && (
        <div>
          <h3>Generated Plot:</h3>
          <img src={dataSrc} alt="Generated Plot" />
        </div>
      )}
    </div>
  );
};

export default PyodidePlot;