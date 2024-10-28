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
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Define the levels for each factor
factor1_levels = [1, 2]  # Factor with 2 levels
factor2_levels = [1, 2, 3, 4, 5, 6]  # Factor with 6 levels

# Generate all combinations of levels for the block
all_combinations = [(f1, f2) for f1 in factor1_levels for f2 in factor2_levels]

# Set the number of blocks you want
num_blocks = 5

# Generate randomized blocks
randomized_blocks = []
for _ in range(num_blocks):
    block = np.random.permutation(all_combinations)  # Randomize order
    randomized_blocks.extend(block)

# Convert to DataFrame for better readability
df = pd.DataFrame(randomized_blocks, columns=['Factor1', 'Factor2'])

# Assign a color for each unique combination
unique_combinations = df.drop_duplicates().reset_index(drop=True)
colors = sns.color_palette("pastel", len(unique_combinations))
color_map = {tuple(row): colors[i] for i, row in unique_combinations.iterrows()}

# Map colors to each row based on combination
df_colors = df.apply(lambda row: color_map[(row['Factor1'], row['Factor2'])], axis=1)

# Display the color-coded DataFrame
fig, ax = plt.subplots(figsize=(8, len(df) // 2))
ax.axis('off')
table = ax.table(cellText=df.values, colLabels=df.columns, cellColours=df_colors.values.reshape(-1, 1, 3),
                 cellLoc='center', loc='center')

plt.show()
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