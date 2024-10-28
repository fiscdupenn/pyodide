"use client"

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

        // Load only essential packages first
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

    // Defer heavy packages until plot generation
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install('matplotlib')
      await micropip.install('seaborn')
    `);

    const pythonCode = `
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from io import BytesIO
import base64

# Setting random seed for reproducibility
np.random.seed(42)

# Parameters for block randomization
num_blocks = 5  # Number of blocks
num_groups = 2  # Number of treatment groups
subjects_per_block = 10  # Subjects per block

# Generate block data with correct sampling
data = {
    "Block": np.repeat(range(1, num_blocks + 1), subjects_per_block),
    "Subject": range(1, num_blocks * subjects_per_block + 1),
    "Group": np.tile(
        np.random.choice(range(1, num_groups + 1), num_groups, replace=False), 
        num_blocks * (subjects_per_block // num_groups)
    ).tolist() + np.random.choice(range(1, num_groups + 1), subjects_per_block % num_groups, replace=True).tolist()
}

# Create a DataFrame
df = pd.DataFrame(data)

# Plotting with Seaborn
plt.figure(figsize=(10, 6))
sns.countplot(data=df, x="Block", hue="Group", palette="Set2")

# Customizing the plot
plt.title("Block Randomization of Subjects into Treatment Groups")
plt.xlabel("Block")
plt.ylabel("Number of Subjects")
plt.legend(title="Group")

# Convert plot to base64 string
buffer = BytesIO()
plt.savefig(buffer, format='png')
buffer.seek(0)
img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
buffer.close()

img_base64
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