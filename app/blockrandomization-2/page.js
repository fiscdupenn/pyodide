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
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from io import BytesIO
import base64

# Define the number of blocks and groups
num_blocks = 10
num_groups = 5

# Generate random block positions and sizes
np.random.seed(42)  # For reproducibility
block_data = {
    'x': np.random.rand(num_blocks) * 10,
    'y': np.random.rand(num_blocks) * 10,
    'width': np.random.rand(num_blocks) * 0.8 + 0.2,
    'height': np.random.rand(num_blocks) * 0.8 + 0.2,
    'block': [f'Block {i+1}' for i in range(num_blocks)],
    'group': [f'Group {i // 2 + 1}' for i in range(num_blocks)]  # Divide into 5 groups
}

# Create a DataFrame for easy handling
blocks_df = pd.DataFrame(block_data)

# Set up the seaborn color palette with unique colors per group
palette = sns.color_palette("tab20", num_groups)  # Use tab20 for a diverse palette

# Plot each block as a colored rectangle, grouped by color
fig, ax = plt.subplots(figsize=(8, 8))
for i, row in blocks_df.iterrows():
    group_idx = int(i // 2)  # Get the group index for coloring
    ax.add_patch(plt.Rectangle(
        (row['x'], row['y']),
        row['width'],
        row['height'],
        color=palette[group_idx],
        label=row['group'] if i % 2 == 0 else ""  # Label each group only once in the legend
    ))

# Add labels and adjust layout
plt.xlim(0, 10)
plt.ylim(0, 10)
plt.xlabel('X Position')
plt.ylabel('Y Position')
plt.title('Block Randomization with Different Colors for Each Group')
handles, labels = ax.get_legend_handles_labels()
unique_labels = dict(zip(labels, handles))  # Remove duplicate labels
plt.legend(unique_labels.values(), unique_labels.keys(), loc="upper left", bbox_to_anchor=(1, 1))

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