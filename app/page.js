"use client";

import { useEffect, useRef, useState } from "react";

const PyodidePlot = () => {
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSrc, setDataSrc] = useState(null);
  const [plotReady, setPlotReady] = useState(false);

  const [pythonCode, setPythonCode] = useState(`
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

#
# Save plot to a base64 string
# The below code is needed to show plot on this webpage
#
buffer = BytesIO()
plt.savefig(buffer, format='png')
buffer.seek(0)
encoded_image = base64.b64encode(buffer.read()).decode('utf-8')
encoded_image
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
      <h1>This webpage generates a plot written in Python using matplotlib and seaborn.</h1>
      <h2>penguins.csv resides on the webserver with the following columns: </h2> 
      <h3>species, island, bill_length_mm, bill_depth_mm, flipper_length_mm, body_mass_g, sex</h3>
      {pyodideLoading && !plotReady && <p>Loading Pyodide...</p>}
      {!pyodideLoading && (
        <>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            rows={30}
            cols={80}
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